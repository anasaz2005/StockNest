const router = require('express').Router();
const Joi = require('joi');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

router.use(auth);

const schema = Joi.object({
  customer: Joi.string().hex().length(24).required(),
  items: Joi.array().min(1).items(Joi.object({
    product: Joi.string().hex().length(24).required(),
    quantity: Joi.number().integer().min(1).required(),
  })).required(),
});

router.get('/', asyncHandler(async (req, res) =>
  res.json(await Order.find().sort('-createdAt').limit(200).populate('customer', 'name phone').populate('createdBy', 'name'))));

router.get('/:id', asyncHandler(async (req, res) => {
  const o = await Order.findById(req.params.id).populate('customer').populate('createdBy', 'name');
  if (!o) throw new ApiError(404, 'Order not found');
  res.json(o);
}));

// Create order + automatically deduct stock.
router.post('/', validate(schema), asyncHandler(async (req, res) => {
  if (!(await Customer.exists({ _id: req.body.customer }))) throw new ApiError(404, 'Customer not found');

  // merge duplicate product lines so each product is checked once
  const wanted = new Map();
  for (const it of req.body.items) wanted.set(it.product, (wanted.get(it.product) || 0) + it.quantity);

  const deducted = []; // remembered so we can roll back if any later line fails
  try {
    const items = [];
    for (const [product, quantity] of wanted) {
      // atomic "check stock and deduct" in a single DB operation (no overselling under concurrency)
      const p = await Product.findOneAndUpdate({ _id: product, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true });
      if (!p) {
        const existing = await Product.findById(product);
        throw new ApiError(400, existing ? `Insufficient stock for ${existing.name} (available: ${existing.stock})` : 'Product not found');
      }
      deducted.push({ product, quantity });
      items.push({ product: p._id, name: p.name, sku: p.sku, quantity, price: p.price });
    }
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const order = await Order.create({ customer: req.body.customer, items, total, createdBy: req.user._id });
    await StockMovement.insertMany(items.map((i) => ({
      product: i.product, type: 'out', quantity: i.quantity, reason: 'order', note: `Order ${order._id}`, user: req.user._id,
    })));
    res.status(201).json(order);
  } catch (err) {
    // roll back any stock already deducted
    for (const d of deducted) await Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } });
    throw err;
  }
}));

// Cancel order: put the stock back
router.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const order = await Order.findOneAndUpdate({ _id: req.params.id, status: 'completed' }, { status: 'cancelled' }, { new: true });
  if (!order) throw new ApiError(400, 'Order not found or already cancelled');
  for (const i of order.items) await Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } });
  await StockMovement.insertMany(order.items.map((i) => ({
    product: i.product, type: 'in', quantity: i.quantity, reason: 'order-cancel', note: `Order ${order._id} cancelled`, user: req.user._id,
  })));
  res.json(order);
}));

module.exports = router;

const router = require('express').Router();
const Joi = require('joi');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

router.use(auth);

const schema = Joi.object({
  product: Joi.string().hex().length(24).required(),
  quantity: Joi.number().integer().min(1).required(),
  note: Joi.string().allow('').optional(),
});

// Stock-in: increase stock and log it
router.post('/stock-in', validate(schema), asyncHandler(async (req, res) => {
  const { product, quantity, note } = req.body;
  const p = await Product.findByIdAndUpdate(product, { $inc: { stock: quantity } }, { new: true });
  if (!p) throw new ApiError(404, 'Product not found');
  await StockMovement.create({ product, type: 'in', quantity, note, user: req.user._id });
  res.json(p);
}));

// Stock-out: the filter { stock >= quantity } makes the check + decrement ONE atomic DB operation,
// so two simultaneous requests can never push stock below zero.
router.post('/stock-out', validate(schema), asyncHandler(async (req, res) => {
  const { product, quantity, note } = req.body;
  const p = await Product.findOneAndUpdate({ _id: product, stock: { $gte: quantity } }, { $inc: { stock: -quantity } }, { new: true });
  if (!p) {
    const exists = await Product.exists({ _id: product });
    throw new ApiError(exists ? 400 : 404, exists ? 'Insufficient stock' : 'Product not found');
  }
  await StockMovement.create({ product, type: 'out', quantity, note, user: req.user._id });
  res.json(p);
}));

// Low-stock alerts: stock <= the product's own threshold
router.get('/low-stock', asyncHandler(async (req, res) =>
  res.json(await Product.find({ $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).sort('stock'))));

router.get('/movements', asyncHandler(async (req, res) => {
  const filter = req.query.product ? { product: req.query.product } : {};
  res.json(await StockMovement.find(filter).sort('-createdAt').limit(100)
    .populate('product', 'name sku').populate('user', 'name'));
}));

module.exports = router;

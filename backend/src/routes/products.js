const router = require('express').Router();
const Joi = require('joi');
const Product = require('../models/Product');
const validate = require('../middleware/validate');
const { auth, allow } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

router.use(auth);

const schema = Joi.object({
  name: Joi.string().min(2).required(),
  sku: Joi.string().min(2).required(),
  category: Joi.string().allow('').default('General'),
  price: Joi.number().min(0).required(),
  stock: Joi.number().integer().min(0).default(0),
  lowStockThreshold: Joi.number().integer().min(0).default(10),
});

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/products?q=search&category=x
router.get('/', asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escape(String(req.query.q)), 'i');
    filter.$or = [{ name: rx }, { sku: rx }, { category: rx }];
  }
  if (req.query.category) filter.category = req.query.category;
  res.json(await Product.find(filter).sort('name'));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  res.json(p);
}));

router.post('/', validate(schema), asyncHandler(async (req, res) => res.status(201).json(await Product.create(req.body))));

// stock is changed only through /inventory or orders, so edits can't silently overwrite it
router.put('/:id', validate(schema.fork(['stock'], (s) => s.strip())), asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!p) throw new ApiError(404, 'Product not found');
  res.json(p);
}));

router.delete('/:id', allow('admin'), asyncHandler(async (req, res) => {
  const p = await Product.findByIdAndDelete(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  res.json({ message: 'Product deleted' });
}));

module.exports = router;

const router = require('express').Router();
const Joi = require('joi');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const validate = require('../middleware/validate');
const { auth, allow } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

router.use(auth);

const schema = Joi.object({
  name: Joi.string().min(2).required(),
  phone: Joi.string().allow('').optional(),
  email: Joi.string().email().allow('').optional(),
  address: Joi.string().allow('').optional(),
});

router.get('/', asyncHandler(async (req, res) => {
  const filter = req.query.q ? { name: new RegExp(String(req.query.q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } : {};
  res.json(await Customer.find(filter).sort('name'));
}));
router.post('/', validate(schema), asyncHandler(async (req, res) => res.status(201).json(await Customer.create(req.body))));
router.put('/:id', validate(schema), asyncHandler(async (req, res) => {
  const c = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!c) throw new ApiError(404, 'Customer not found');
  res.json(c);
}));
router.delete('/:id', allow('admin'), asyncHandler(async (req, res) => {
  if (await Order.exists({ customer: req.params.id })) throw new ApiError(400, 'Customer has orders and cannot be deleted');
  const c = await Customer.findByIdAndDelete(req.params.id);
  if (!c) throw new ApiError(404, 'Customer not found');
  res.json({ message: 'Customer deleted' });
}));

module.exports = router;

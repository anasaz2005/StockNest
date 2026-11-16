const router = require('express').Router();
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { auth, allow } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

router.use(auth, allow('admin')); // user management is admin-only

const schema = Joi.object({
  name: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'staff').default('staff'),
});

router.get('/', asyncHandler(async (req, res) => res.json(await User.find().sort('-createdAt'))));

router.post('/', validate(schema), asyncHandler(async (req, res) => {
  const user = await User.create({ ...req.body, password: await bcrypt.hash(req.body.password, 10) });
  res.status(201).json({ id: user._id, name: user.name, email: user.email, role: user.role });
}));

router.patch('/:id/active', asyncHandler(async (req, res) => {
  if (req.params.id === String(req.user._id)) throw new ApiError(400, 'You cannot disable your own account');
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  user.active = !user.active;
  await user.save();
  res.json(user);
}));

module.exports = router;

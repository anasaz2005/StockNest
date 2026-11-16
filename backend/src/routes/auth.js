const router = require('express').Router();
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const validate = require('../middleware/validate');
const { auth } = require('../middleware/auth');
const { ApiError, asyncHandler } = require('../middleware/error');

const loginSchema = Joi.object({ email: Joi.string().email().required(), password: Joi.string().required() });

router.post('/login', validate(loginSchema), asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !user.active || !(await bcrypt.compare(req.body.password, user.password)))
    throw new ApiError(401, 'Invalid email or password');
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '1d' });
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}));

router.get('/me', auth, (req, res) => {
  const u = req.user;
  res.json({ id: u._id, name: u.name, email: u.email, role: u.role });
});

// JWTs are stateless: logout = the client discards the token. Endpoint exists for a clean API contract.
router.post('/logout', auth, (req, res) => res.json({ message: 'Logged out' }));

module.exports = router;

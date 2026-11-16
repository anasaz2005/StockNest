const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler } = require('./error');

// 1) Authentication: verify the Bearer token and load the user
const auth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required');
  let payload;
  try { payload = jwt.verify(token, process.env.JWT_SECRET); }
  catch { throw new ApiError(401, 'Invalid or expired token'); }
  const user = await User.findById(payload.id);
  if (!user || !user.active) throw new ApiError(401, 'User not found or disabled');
  req.user = user;
  next();
});

// 2) Authorization: only listed roles may continue
const allow = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : next(new ApiError(403, 'You do not have permission for this action'));

module.exports = { auth, allow };

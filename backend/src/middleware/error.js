class ApiError extends Error {
  constructor(status, message, errors) { super(message); this.status = status; this.errors = errors; }
}
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Central error handler: every error leaves the API as { message, errors? }
function errorHandler(err, req, res, next) {
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    return res.status(409).json({ message: `${field} already exists` });
  }
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Internal server error' : err.message, errors: err.errors });
}
module.exports = { ApiError, asyncHandler, errorHandler };

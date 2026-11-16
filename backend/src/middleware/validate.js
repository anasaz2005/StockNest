const { ApiError } = require('./error');
// validate(schema) checks req.body against a Joi schema and replaces it with the cleaned value
module.exports = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return next(new ApiError(400, 'Validation failed', error.details.map((d) => d.message)));
  req.body = value;
  next();
};

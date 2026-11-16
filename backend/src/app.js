const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const { errorHandler, ApiError } = require('./middleware/error');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => res.json({ status: 'ok', docs: '/api-docs' }));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(require('./swagger')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res, next) => next(new ApiError(404, 'Route not found')));
app.use(errorHandler);

module.exports = app;

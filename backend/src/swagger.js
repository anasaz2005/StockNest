const id = { name: 'id', in: 'path', required: true, schema: { type: 'string' } };
const body = (props, required) => ({ required: true, content: { 'application/json': { schema: { type: 'object', required, properties: props } } } });
const S = { type: 'string' }, N = { type: 'number' };
const secured = [{ bearerAuth: [] }];
const ok = { 200: { description: 'Success' } };

module.exports = {
  openapi: '3.0.0',
  info: { title: 'Smart Inventory & Order Management API', version: '1.0.0', description: 'Login via POST /api/auth/login, then click "Authorize" and paste the token. Errors return { message, errors? }.' },
  components: { securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } } },
  paths: {
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Login', requestBody: body({ email: S, password: S }, ['email', 'password']), responses: { ...ok, 401: { description: 'Invalid credentials' } } } },
    '/api/auth/me': { get: { tags: ['Auth'], summary: 'Current user', security: secured, responses: ok } },
    '/api/auth/logout': { post: { tags: ['Auth'], summary: 'Logout (client discards token)', security: secured, responses: ok } },
    '/api/users': {
      get: { tags: ['Users (admin)'], summary: 'List users', security: secured, responses: ok },
      post: { tags: ['Users (admin)'], summary: 'Create user', security: secured, requestBody: body({ name: S, email: S, password: S, role: { type: 'string', enum: ['admin', 'staff'] } }, ['name', 'email', 'password']), responses: { 201: { description: 'Created' } } },
    },
    '/api/users/{id}/active': { patch: { tags: ['Users (admin)'], summary: 'Enable/disable user', security: secured, parameters: [id], responses: ok } },
    '/api/products': {
      get: { tags: ['Products'], summary: 'List / search products', security: secured, parameters: [{ name: 'q', in: 'query', schema: S }, { name: 'category', in: 'query', schema: S }], responses: ok },
      post: { tags: ['Products'], summary: 'Add product', security: secured, requestBody: body({ name: S, sku: S, category: S, price: N, stock: N, lowStockThreshold: N }, ['name', 'sku', 'price']), responses: { 201: { description: 'Created' } } },
    },
    '/api/products/{id}': {
      get: { tags: ['Products'], summary: 'Get product', security: secured, parameters: [id], responses: ok },
      put: { tags: ['Products'], summary: 'Edit product (stock is not editable here)', security: secured, parameters: [id], requestBody: body({ name: S, sku: S, category: S, price: N, lowStockThreshold: N }, ['name', 'sku', 'price']), responses: ok },
      delete: { tags: ['Products'], summary: 'Delete product (admin)', security: secured, parameters: [id], responses: ok },
    },
    '/api/inventory/stock-in': { post: { tags: ['Inventory'], summary: 'Add stock', security: secured, requestBody: body({ product: S, quantity: N, note: S }, ['product', 'quantity']), responses: ok } },
    '/api/inventory/stock-out': { post: { tags: ['Inventory'], summary: 'Remove stock (fails if insufficient)', security: secured, requestBody: body({ product: S, quantity: N, note: S }, ['product', 'quantity']), responses: ok } },
    '/api/inventory/low-stock': { get: { tags: ['Inventory'], summary: 'Products at or below threshold', security: secured, responses: ok } },
    '/api/inventory/movements': { get: { tags: ['Inventory'], summary: 'Stock movement history', security: secured, parameters: [{ name: 'product', in: 'query', schema: S }], responses: ok } },
    '/api/customers': {
      get: { tags: ['Customers'], summary: 'List customers', security: secured, parameters: [{ name: 'q', in: 'query', schema: S }], responses: ok },
      post: { tags: ['Customers'], summary: 'Add customer', security: secured, requestBody: body({ name: S, phone: S, email: S, address: S }, ['name']), responses: { 201: { description: 'Created' } } },
    },
    '/api/customers/{id}': {
      put: { tags: ['Customers'], summary: 'Edit customer', security: secured, parameters: [id], requestBody: body({ name: S, phone: S, email: S, address: S }, ['name']), responses: ok },
      delete: { tags: ['Customers'], summary: 'Delete customer (admin)', security: secured, parameters: [id], responses: ok },
    },
    '/api/orders': {
      get: { tags: ['Orders'], summary: 'List orders', security: secured, responses: ok },
      post: { tags: ['Orders'], summary: 'Create order and deduct stock', security: secured, requestBody: body({ customer: S, items: { type: 'array', items: { type: 'object', properties: { product: S, quantity: N } } } }, ['customer', 'items']), responses: { 201: { description: 'Created' }, 400: { description: 'Insufficient stock' } } },
    },
    '/api/orders/{id}': { get: { tags: ['Orders'], summary: 'Order details', security: secured, parameters: [id], responses: ok } },
    '/api/orders/{id}/cancel': { patch: { tags: ['Orders'], summary: 'Cancel order and restore stock', security: secured, parameters: [id], responses: ok } },
    '/api/reports/dashboard': { get: { tags: ['Reports'], summary: 'Dashboard summary', security: secured, responses: ok } },
    '/api/reports/sales': { get: { tags: ['Reports'], summary: 'Sales report (admin)', security: secured, parameters: [{ name: 'from', in: 'query', schema: S }, { name: 'to', in: 'query', schema: S }], responses: ok } },
    '/api/reports/inventory': { get: { tags: ['Reports'], summary: 'Inventory report (admin)', security: secured, responses: ok } },
  },
};

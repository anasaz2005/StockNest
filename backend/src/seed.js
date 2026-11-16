// Creates the first admin user + sample data.   Run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const email = process.env.ADMIN_EMAIL || 'admin@codebxo.com';
  if (!(await User.exists({ email }))) {
    await User.create({ name: 'Admin', email, password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin@123', 10), role: 'admin' });
    await User.create({ name: 'Staff User', email: 'staff@codebxo.com', password: await bcrypt.hash('Staff@123', 10), role: 'staff' });
    console.log(`Created admin ${email} and staff@codebxo.com`);
  }
  if (!(await Product.countDocuments())) {
    await Product.insertMany([
      { name: 'Wireless Mouse', sku: 'MOU-001', category: 'Accessories', price: 799, stock: 40, lowStockThreshold: 10 },
      { name: 'Mechanical Keyboard', sku: 'KEY-001', category: 'Accessories', price: 3499, stock: 8, lowStockThreshold: 10 },
      { name: 'USB-C Cable', sku: 'CAB-001', category: 'Cables', price: 299, stock: 120, lowStockThreshold: 25 },
      { name: '24" Monitor', sku: 'MON-024', category: 'Displays', price: 10999, stock: 5, lowStockThreshold: 5 },
    ]);
    await Customer.insertMany([
      { name: 'Asha Traders', phone: '9876543210', email: 'asha@example.com', address: 'Kochi, Kerala' },
      { name: 'Nair Electronics', phone: '9123456780', email: 'nair@example.com', address: 'Thrissur, Kerala' },
    ]);
    console.log('Sample products and customers added');
  }
  await mongoose.disconnect();
})();

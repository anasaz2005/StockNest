const { Schema, model } = require('mongoose');
module.exports = model('Product', new Schema({
  name: { type: String, required: true, trim: true },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
  category: { type: String, trim: true, default: 'General' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockThreshold: { type: Number, default: 10, min: 0 },
}, { timestamps: true }));

const { Schema, model } = require('mongoose');
module.exports = model('Customer', new Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, trim: true },
}, { timestamps: true }));

const { Schema, model } = require('mongoose');
module.exports = model('User', new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  active: { type: Boolean, default: true },
}, { timestamps: true }));

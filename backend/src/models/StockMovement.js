const { Schema, model } = require('mongoose');
// Every stock change (manual or from an order) is logged here for traceability
module.exports = model('StockMovement', new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  type: { type: String, enum: ['in', 'out'], required: true },
  quantity: { type: Number, required: true, min: 1 },
  reason: { type: String, enum: ['manual', 'order', 'order-cancel'], default: 'manual' },
  note: String,
  user: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));

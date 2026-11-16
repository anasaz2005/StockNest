const { Schema, model } = require('mongoose');
const item = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String, sku: String,            // snapshot, so old orders stay correct if the product changes
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
}, { _id: false });
module.exports = model('Order', new Schema({
  customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
  items: { type: [item], validate: (v) => v.length > 0 },
  total: { type: Number, required: true },
  status: { type: String, enum: ['completed', 'cancelled'], default: 'completed' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true }));

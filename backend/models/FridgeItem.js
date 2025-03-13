const mongoose = require('mongoose');

const fridgeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['dairy', 'meat', 'vegetables', 'fruits', 'beverages', 'condiments', 'other']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fridge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Fridge',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('FridgeItem', fridgeItemSchema);

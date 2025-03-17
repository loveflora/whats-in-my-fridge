const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['lunch', 'dinner'],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  ingredients: [{
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FridgeItem'
    },
    quantity: Number,
    unit: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cook: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cookName: {
    type: String
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Menu', menuSchema);

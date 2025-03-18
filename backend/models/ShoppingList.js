const mongoose = require('mongoose');

const shoppingListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  favorite: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  buyer: {
      type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

module.exports = mongoose.model('ShoppingList', shoppingListSchema);

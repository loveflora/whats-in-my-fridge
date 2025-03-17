const mongoose = require('mongoose');

const shoppingListItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: String,
  completed: {
    type: Boolean,
    default: false
  },
  favorite: {
    type: Boolean,
    default: false
  }
});

const shoppingListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  items: [shoppingListItemSchema],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { timestamps: true });

module.exports = mongoose.model('ShoppingList', shoppingListSchema);

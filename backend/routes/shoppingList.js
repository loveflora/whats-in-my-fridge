const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ShoppingList = require('../models/ShoppingList');

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Get all shopping lists
router.get('/lists', auth, async (req, res) => {
  try {
    const lists = await ShoppingList.find({
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });
    res.json(lists);
  } catch (error) {
    console.error('Get shopping lists error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific shopping list
router.get('/lists/:id', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }
    
    res.json(list);
  } catch (error) {
    console.error('Get shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new shopping list
router.post('/lists', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const newList = new ShoppingList({
      name,
      owner: req.userId,
      items: []
    });

    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update shopping list name
router.put('/lists/:id', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const list = await ShoppingList.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [
          { owner: req.userId },
          { sharedWith: req.userId }
        ]
      },
      { name },
      { new: true }
    );
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }
    
    res.json(list);
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete shopping list
router.delete('/lists/:id', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId // Only owner can delete
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found or not owner' });
    }
    
    res.json({ message: 'Shopping list deleted' });
  } catch (error) {
    console.error('Delete shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all items from a shopping list
router.get('/items', auth, async (req, res) => {
  try {
    const { listId } = req.query;
    
    if (!listId) {
      return res.status(400).json({ message: 'listId is required' });
    }
    
    const list = await ShoppingList.findOne({
      _id: listId,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });
    
    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }
    
    // Transform items to match frontend expectations
    const items = list.items.map(item => ({
      _id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      completed: item.completed,
      listId: list._id,
      createdAt: item.createdAt || new Date()
    }));
    
    res.json(items);
  } catch (error) {
    console.error('Get shopping items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to shopping list
router.post('/items', auth, async (req, res) => {
  try {
    const { name, quantity, unit, completed, listId } = req.body;
    
    if (!listId) {
      return res.status(400).json({ message: 'listId is required' });
    }
    
    const list = await ShoppingList.findOne({
      _id: listId,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const newItem = {
      name,
      quantity,
      unit,
      completed: completed || false,
      createdAt: new Date()
    };
    
    list.items.push(newItem);
    await list.save();
    
    // Return the newly created item with its ID
    const addedItem = list.items[list.items.length - 1];
    const itemResponse = {
      _id: addedItem._id,
      name: addedItem.name,
      quantity: addedItem.quantity,
      unit: addedItem.unit,
      completed: addedItem.completed,
      listId: list._id,
      createdAt: addedItem.createdAt
    };
    
    res.status(201).json(itemResponse);
  } catch (error) {
    console.error('Add item to shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update item in shopping list
router.put('/items/:id', auth, async (req, res) => {
  try {
    const { name, quantity, unit, completed } = req.body;
    
    // Find the list containing this item
    const list = await ShoppingList.findOne({
      'items._id': req.params.id,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });

    if (!list) {
      return res.status(404).json({ message: 'Item or list not found' });
    }

    // Find the item and update it
    const item = list.items.id(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Update only provided fields
    if (name !== undefined) item.name = name;
    if (quantity !== undefined) item.quantity = quantity;
    if (unit !== undefined) item.unit = unit;
    if (completed !== undefined) item.completed = completed;

    await list.save();
    
    // Return the updated item
    const updatedItem = {
      _id: item._id,
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      completed: item.completed,
      listId: list._id,
      createdAt: item.createdAt
    };
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Update shopping list item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete item from shopping list
router.delete('/items/:id', auth, async (req, res) => {
  try {
    // Find the list containing this item
    const list = await ShoppingList.findOne({
      'items._id': req.params.id,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });

    if (!list) {
      return res.status(404).json({ message: 'Item or list not found' });
    }

    // Remove the item
    list.items.id(req.params.id).remove();
    await list.save();
    
    res.json({ message: 'Item deleted' });
  } catch (error) {
    console.error('Delete shopping list item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share shopping list with user
router.post('/lists/:id/share', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      owner: req.userId
    });

    if (!list) {
      return res.status(404).json({ message: 'Shopping list not found' });
    }

    const { userId } = req.body;
    if (list.sharedWith.includes(userId)) {
      return res.status(400).json({ message: 'List already shared with this user' });
    }

    list.sharedWith.push(userId);
    await list.save();
    res.json(list);
  } catch (error) {
    console.error('Share shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

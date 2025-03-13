const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const FridgeItem = require('../models/FridgeItem');

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

// Get all items
router.get('/items', auth, async (req, res) => {
  try {
    const items = await FridgeItem.find({ owner: req.userId });
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new item
router.post('/items', auth, async (req, res) => {
  try {
    const { name, quantity, unit, expiryDate, category } = req.body;
    
    const newItem = new FridgeItem({
      name,
      quantity,
      unit,
      expiryDate,
      category,
      owner: req.userId,
      fridge: '65f0f1234567890123456789'
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update item
router.put('/items/:id', auth, async (req, res) => {
  try {
    const item = await FridgeItem.findOne({
      _id: req.params.id,
      owner: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { name, quantity, unit, expiryDate, category } = req.body;
    
    item.name = name || item.name;
    item.quantity = quantity || item.quantity;
    item.unit = unit || item.unit;
    item.expiryDate = expiryDate || item.expiryDate;
    item.category = category || item.category;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete item
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const item = await FridgeItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    res.json({ message: 'Item removed' });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

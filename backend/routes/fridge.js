const express = require('express');
const router = express.Router();
const FridgeItem = require('../models/FridgeItem');
const auth = require('../middleware/auth');

// Get all items
router.get('/items', auth, async (req, res) => {
  try {
    const items = await FridgeItem.find({ owner: req.user.id });
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single item by ID
router.get('/items/:id', auth, async (req, res) => {
  try {
    console.log('냉장고 아이템 상세 조회 요청:', req.params.id);
    
    const item = await FridgeItem.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!item) {
      console.log('아이템을 찾을 수 없음:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    console.log('아이템 조회 성공:', item._id);
    res.json(item);
  } catch (error) {
    console.error('Get item details error:', error);
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
      owner: req.user.id,
      // fridge: '65f0f1234567890123456789'
    });

    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Add item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Update item
router.put('/items/:id', auth, async (req, res) => {
  try {
    const item = await FridgeItem.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    const { name, quantity, unit, expiryDate, category, favorite, completed } = req.body;
    
    item.name = name || item.name;
    item.quantity = quantity || item.quantity;
    item.unit = unit || item.unit;
    item.expiryDate = expiryDate || item.expiryDate;
    item.category = category || item.category;
    item.favorite = favorite || item.favorite;
    item.completed = completed || item.completed;

    await item.save();
    res.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Delete item
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const item = await FridgeItem.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
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

//; Search items
router.get('/search', auth, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Create a case-insensitive regex for the search term
    const searchRegex = new RegExp(query, 'i');

    // Find items that match the search criteria
    const items = await FridgeItem.find({
      owner: req.user.id,
      $or: [
        { name: searchRegex }
        // Add more fields to search here if needed
      ]
    }).populate('category');

    // Also search in category names (if category is populated)
    const filteredItems = items.filter(item => {
      // If category is populated and is an object with a name property
      if (item.category && typeof item.category === 'object' && item.category.name) {
        return searchRegex.test(item.category.name) || searchRegex.test(item.name);
      }
      // If category is just a string (old data format)
      else if (typeof item.category === 'string') {
        return searchRegex.test(item.category) || searchRegex.test(item.name);
      }
      // Just test the name if category is not available
      return searchRegex.test(item.name);
    });

    res.json(filteredItems);
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

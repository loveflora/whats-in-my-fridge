const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const auth = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all categories for the logged in user
router.get('/', auth, async (req, res) => {
  try {
    const categories = await Category.find({ owner: req.user.id });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get a specific category by ID
router.get('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const category = await Category.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create a new category
router.post('/', auth, async (req, res) => {
  const { name, color, icon } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    // Check if category with the same name already exists for this user
    const existingCategory = await Category.findOne({
      name: name.trim(),
      owner: req.user.id
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'A category with this name already exists' });
    }

    const newCategory = new Category({
      name: name.trim(),
      color: color || '#3478F6', // Default blue color
      icon: icon || 'help', 
      owner: req.user.id
    });

    const savedCategory = await newCategory.save();
    res.status(201).json(savedCategory);
  } catch (err) {
    console.error(err.message);
    if (err.code === 11000) { // Duplicate key error
      return res.status(400).json({ message: 'A category with this name already exists' });
    }
    res.status(500).send('Server Error');
  }
});

// Update a category
router.put('/:id', auth, async (req, res) => {
  const { name, color, icon } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Category name is required' });
  }

  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    // Check if another category with the same name exists for this user
    const existingCategory = await Category.findOne({
      name: name.trim(),
      owner: req.user.id,
      _id: { $ne: req.params.id }
    });

    if (existingCategory) {
      return res.status(400).json({ message: 'Another category with this name already exists' });
    }

    // Find the category and update it
    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { name: name.trim(), color, icon },
      { new: true } // Return the updated document
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all items in a specific category
router.get('/:id/items', auth, async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    // Verify category exists and belongs to the user
    const category = await Category.findOne({
      _id: categoryId,
      owner: req.user.id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Find all fridge items with the specified category ID
    const FridgeItem = require('../models/FridgeItem');
    const items = await FridgeItem.find({
      category: categoryId,
      owner: req.user.id
    }).sort({ updatedAt: -1 }); // Most recently updated first

    res.json(items);
  } catch (error) {
    console.error('Error fetching category items:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a category
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid category ID format' });
    }

    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
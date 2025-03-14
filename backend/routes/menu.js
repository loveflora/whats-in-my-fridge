const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Menu = require('../models/Menu');

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

// Get meals by date range
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const meals = await Menu.find(query)
      .populate('ingredients.item')
      .sort({ date: 1 });
    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add new meal
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, date, ingredients } = req.body;
    
    const newMeal = new Menu({
      name,
      type,
      date,
      ingredients,
      owner: req.userId
    });

    await newMeal.save();
    const populatedMeal = await Menu.findById(newMeal._id).populate('ingredients.item');
    res.status(201).json(populatedMeal);
  } catch (error) {
    console.error('Add meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update meal
router.put('/:id', auth, async (req, res) => {
  try {
    const meal = await Menu.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.userId },
        { sharedWith: req.userId }
      ]
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    const { name, type, date, ingredients } = req.body;
    
    meal.name = name || meal.name;
    meal.type = type || meal.type;
    meal.date = date || meal.date;
    meal.ingredients = ingredients || meal.ingredients;

    await meal.save();
    const populatedMeal = await Menu.findById(meal._id).populate('ingredients.item');
    res.json(populatedMeal);
  } catch (error) {
    console.error('Update meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete meal
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Menu.findOneAndDelete({
      _id: req.params.id,
      owner: req.userId
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json({ message: 'Meal removed' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Share meal with user
router.post('/:id/share', auth, async (req, res) => {
  try {
    const meal = await Menu.findOne({
      _id: req.params.id,
      owner: req.userId
    });

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    const { userId } = req.body;
    if (meal.sharedWith.includes(userId)) {
      return res.status(400).json({ message: 'Meal already shared with this user' });
    }

    meal.sharedWith.push(userId);
    await meal.save();
    const populatedMeal = await Menu.findById(meal._id).populate('ingredients.item');
    res.json(populatedMeal);
  } catch (error) {
    console.error('Share meal error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

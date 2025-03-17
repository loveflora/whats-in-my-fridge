const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const User = require('../models/User');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

// Get meals by date range
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
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
      owner: req.user.id
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
        { owner: req.user.id },
        { sharedWith: req.user.id }
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

// Get single meal by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const meal = await Menu.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    }).populate('ingredients.item');

    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    res.json(meal);
  } catch (error) {
    console.error('Get meal details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete meal
router.delete('/:id', auth, async (req, res) => {
  try {
    const meal = await Menu.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id
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
      owner: req.user.id
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

// 요리사 지정하기
router.put('/:id/assign-cook', auth, async (req, res) => {
  try {
    const meal = await Menu.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    });

    if (!meal) {
      return res.status(404).json({ message: '메뉴를 찾을 수 없습니다.' });
    }

    const { cookId, cookName, groupId } = req.body;
    
    if (!cookId || !cookName) {
      return res.status(400).json({ message: '요리사 정보가 필요합니다.' });
    }

    meal.cook = cookId;
    meal.cookName = cookName;
    
    if (groupId) {
      meal.group = groupId;
    }

    await meal.save();

    // 그룹 멤버들에게 알림 보내기
    if (groupId) {
      const group = await Group.findById(groupId).populate('members');
      
      if (group) {
        const cook = await User.findById(cookId);
        const menuDate = new Date(meal.date).toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // 그룹의 모든 멤버에게 알림 보내기
        const notificationPromises = group.members.map(member => {
          // 요리사 본인에게는 다른 메시지 보내기
          const isCook = member._id.toString() === cookId;
          const message = isCook
            ? `${menuDate}에 ${meal.name} 요리를 담당하게 되었습니다.`
            : `${menuDate}에 ${meal.name} 요리를 ${cookName}님이 담당하게 되었습니다.`;
          
          return new Notification({
            recipient: member._id,
            type: 'system',
            message: message,
            related: {
              userId: cook._id,
              groupId: group._id,
              menuId: meal._id
            }
          }).save();
        });
        
        await Promise.all(notificationPromises);
      }
    }

    const populatedMeal = await Menu.findById(meal._id)
      .populate('ingredients.item')
      .populate('cook', 'name email');
      
    res.json(populatedMeal);
  } catch (error) {
    console.error('요리사 지정 오류:', error);
    res.status(500).json({ message: '서버 오류' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const FridgeItem = require('../models/FridgeItem');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Get all items
router.get('/items', auth, async (req, res) => {
  try {
    // 카테고리 정보를 함께 가져오기 위해 populate 사용
    const items = await FridgeItem.find({ owner: req.user.id })
      .populate('category', 'name color icon')
      .lean();
    
    // 응답 데이터 변환: category가 객체인 경우 category 필드를 name으로 변경
    const processedItems = items.map(item => {
      if (item.category && typeof item.category === 'object') {
        // 원본 카테고리 객체의 정보 저장
        const categoryName = item.category.name;
        const categoryId = item.category._id;
        const categoryColor = item.category.color;
        const categoryIcon = item.category.icon;
        
        // category 필드를 name으로 설정하고, 추가 정보는 별도 필드로 보존
        item.category = categoryName;
        item.categoryId = categoryId;
        item.categoryColor = categoryColor;
        item.categoryIcon = categoryIcon;
      }
      return item;
    });
    
    res.json(processedItems);
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
    }).populate('category', 'name color icon').lean();

    if (!item) {
      console.log('아이템을 찾을 수 없음:', req.params.id);
      return res.status(404).json({ message: 'Item not found' });
    }

    // 카테고리 객체가 있는 경우 카테고리 이름으로 변환하고 추가 정보 보존
    if (item.category && typeof item.category === 'object') {
      const categoryName = item.category.name;
      const categoryId = item.category._id;
      const categoryColor = item.category.color;
      const categoryIcon = item.category.icon;
      
      item.category = categoryName;
      item.categoryId = categoryId;
      item.categoryColor = categoryColor;
      item.categoryIcon = categoryIcon;
    }

    console.log('아이템 조회 성공:', item._id);
    res.json(item);
  } catch (error) {
    console.error('Get item details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Add new item
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
    
    // 기본 필드 업데이트
    item.name = name || item.name;
    item.quantity = quantity || item.quantity;
    item.unit = unit || item.unit;
    item.expiryDate = expiryDate || item.expiryDate;
    item.favorite = favorite !== undefined ? favorite : item.favorite;
    item.completed = completed !== undefined ? completed : item.completed;

    console.log("카테고리>>>>>>", category)
    
    // 카테고리 처리: ObjectId, ID 문자열, 또는 카테고리 이름 모두 처리
    if (category !== undefined) {
      // null인 경우 카테고리 제거
      if (category === null) {
        item.category = null;
      }
      // MongoDB ObjectId 형식인 경우 (24자리 16진수 문자열)
      else if (/^[0-9a-fA-F]{24}$/.test(category)) {
        item.category = category;
      } 
      // 카테고리 이름인 경우 해당 이름의 카테고리를 찾아서 ID 설정
      else {
        const foundCategory = await Category.findOne({ 
          name: category,
          owner: req.user.id
        });
        
        if (foundCategory) {
          item.category = foundCategory._id;
        } else {
          // 이름으로 찾지 못했을 경우 null로 설정
          item.category = null;
        }
      }
    }

    await item.save();
    
    // 응답 전에 카테고리 정보 채우기
    const savedItem = await FridgeItem.findById(item._id)
      .populate('category', 'name color icon')
      .lean();
      
    // 카테고리 객체를 카테고리 이름으로 변환하고 추가 정보 보존
    if (savedItem.category && typeof savedItem.category === 'object') {
      const categoryName = savedItem.category.name;
      const categoryId = savedItem.category._id;
      const categoryColor = savedItem.category.color;
      const categoryIcon = savedItem.category.icon;
      
      savedItem.category = categoryName;
      savedItem.categoryId = categoryId;
      savedItem.categoryColor = categoryColor;
      savedItem.categoryIcon = categoryIcon;
    }
    
    res.json(savedItem);
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

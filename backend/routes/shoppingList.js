const express = require('express');
const router = express.Router();
const ShoppingList = require('../models/ShoppingList');
const auth = require('../middleware/auth'); // 글로벌 auth 미들웨어 사용=
// const jwt = require('jsonwebtoken');



//; Get all shopping items
router.get('/items', auth, async (req, res) => {
  try {
    const items = await ShoppingList.find({
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    });
    res.json(items);
  } catch (error) {
    console.error('Get shopping items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Get a specific shopping item
router.get('/items/:id', auth, async (req, res) => {
  try {
    const item = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    });
    
    if (!item) {
      return res.status(404).json({ message: 'Shopping item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Get shopping item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Create new shopping list
router.post('/items', auth, async (req, res) => {
  try {
    const { name } = req.body;
    
    const newList = new ShoppingList({
      name,
      owner: req.user.id,
      items: []
    });

    await newList.save();
    res.status(201).json(newList);
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


//; Update item in shopping list
router.put('/items/:id', auth, async (req, res) => {
  try {
    const { name, completed, favorite } = req.body;
    
    // Find the item containing this item
    const item = await ShoppingList.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { sharedWith: req.user.id }
      ]
    });

    if (!item) {
      return res.status(404).json({ message: 'Item or item not found' });
    }

    // Update only provided fields
    if (name !== undefined) item.name = name;
    if (completed !== undefined) item.completed = completed;
    if (favorite !== undefined) item.favorite = favorite;

    await item.save();
    
    // Return the updated item
    const updatedItem = {
      _id: item._id,
      name: item.name,
      completed: item.completed,
      favorite: item.favorite,
      createdAt: item.createdAt
    };
    
    res.json(updatedItem);
  } catch (error) {
    console.error('Update shopping list item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//; Delete shopping list
router.delete('/items/:id', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id // Only owner can delete
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


//.. Share shopping list with user
router.post('/items/:id/share', auth, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      _id: req.params.id,
      owner: req.user.id
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



// // Delete item from shopping list
// router.delete('/items/:id', auth, async (req, res) => {
//   try {
//     // Find the list containing this item
//     const list = await ShoppingList.findOne({
//       'items._id': req.params.id,
//       $or: [
//         { owner: req.user.id },
//         { sharedWith: req.user.id }
//       ]
//     });

//     if (!list) {
//       return res.status(404).json({ message: 'Item or list not found' });
//     }

//     // Remove the item
//     list.items.id(req.params.id).remove();
//     await list.save();
    
//     res.json({ message: 'Item deleted' });
//   } catch (error) {
//     console.error('Delete shopping list item error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// module.exports = router;






// // Get all items from a shopping list
// router.get('/items', auth, async (req, res) => {
//   try {
//     const { listId } = req.query;
    
//     if (!listId) {
//       return res.status(400).json({ message: 'listId is required' });
//     }
    
//     const list = await ShoppingList.findOne({
//       _id: listId,
//       $or: [
//         { owner: req.user.id },
//         { sharedWith: req.user.id }
//       ]
//     });
    
//     if (!list) {
//       return res.status(404).json({ message: 'Shopping list not found' });
//     }
    
//     // Transform items to match frontend expectations
//     const items = list.items.map(item => ({
//       _id: item._id,
//       name: item.name,
//       completed: item.completed,
//       favorite: item.favorite,
//       listId: list._id,
//       createdAt: item.createdAt || new Date()
//     }));
    
//     res.json(items);
//   } catch (error) {
//     console.error('Get shopping items error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Add item to shopping list
// router.post('/items', auth, async (req, res) => {
//   try {
//     const { name, completed, favorite, listId } = req.body;
    
//     if (!listId) {
//       return res.status(400).json({ message: 'listId is required' });
//     }
    
//     const list = await ShoppingList.findOne({
//       _id: listId,
//       $or: [
//         { owner: req.user.id },
//         { sharedWith: req.user.id }
//       ]
//     });

//     if (!list) {
//       return res.status(404).json({ message: 'Shopping list not found' });
//     }

//     const newItem = {
//       name,
//       completed: completed || false,
//       favorite: favorite || false,
//       createdAt: new Date()
//     };
    
//     list.items.push(newItem);
//     await list.save();
    
//     // Return the newly created item with its ID
//     const addedItem = list.items[list.items.length - 1];
//     const itemResponse = {
//       _id: addedItem._id,
//       name: addedItem.name,
//       completed: addedItem.completed,
//       favorite: addedItem.favorite,
//       listId: list._id,
//       createdAt: addedItem.createdAt
//     };
    
//     res.status(201).json(itemResponse);
//   } catch (error) {
//     console.error('Add item to shopping list error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update item in shopping list
// router.put('/items/:id', auth, async (req, res) => {
//   try {
//     const { name, completed, favorite } = req.body;
    
//     // Find the list containing this item
//     const list = await ShoppingList.findOne({
//       'items._id': req.params.id,
//       $or: [
//         { owner: req.user.id },
//         { sharedWith: req.user.id }
//       ]
//     });

//     console.log("req>>>>>>>>>", req.params.id, req.user.id )
//     console.log("list>>>>>>>>>>", req.body, list)

//     if (!list) {
//       return res.status(404).json({ message: 'Item or list not found' });
//     }

//     // Find the item and update it
//     const item = list.items.id(req.params.id);
//     if (!item) {
//       return res.status(404).json({ message: 'Item not found' });
//     }

//     // Update only provided fields
//     if (name !== undefined) item.name = name;
//     if (completed !== undefined) item.completed = completed;
//     if (favorite !== undefined) item.favorite = favorite;

//     await list.save();
    
//     // Return the updated item
//     const updatedItem = {
//       _id: item._id,
//       name: item.name,
//       completed: item.completed,
//       favorite: item.favorite,
//       listId: list._id,
//       createdAt: item.createdAt
//     };
    
//     res.json(updatedItem);
//   } catch (error) {
//     console.error('Update shopping list item error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Delete item from shopping list
// router.delete('/items/:id', auth, async (req, res) => {
//   try {
//     // Find the list containing this item
//     const list = await ShoppingList.findOne({
//       'items._id': req.params.id,
//       $or: [
//         { owner: req.user.id },
//         { sharedWith: req.user.id }
//       ]
//     });

//     if (!list) {
//       return res.status(404).json({ message: 'Item or list not found' });
//     }

//     // Remove the item
//     list.items.id(req.params.id).remove();
//     await list.save();
    
//     res.json({ message: 'Item deleted' });
//   } catch (error) {
//     console.error('Delete shopping list item error:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

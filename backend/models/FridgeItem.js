const mongoose = require('mongoose');

const fridgeItemSchema = new mongoose.Schema({
  name: {
    type: String,
    // required: true
  },
  quantity: {
    type: Number,
    // required: true,
    min: 0
  },
  unit: {
    type: String,
    // required: true
  },
  expiryDate: {
    type: Date,
    // required: true
  },
  favorite: {
    type: Boolean,
    default: false
  },
  completed: {
    type: Boolean,
    default: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,  // 기본값을 null로 설정
    required: false // 필수 입력이 아님
  },
  // category: {
  //   type: String,
  //   required: true,
  //   enum: ['dairy', 'meat', 'vegetables', 'fruits', 'beverages', 'condiments', 'other']
  // },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }] // 냉장고 전체를 공유하는 사용자 목록
}, { timestamps: true });


module.exports = mongoose.model('FridgeItem', fridgeItemSchema);


// const mongoose = require('mongoose');

// const fridgeItemSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true
//   },
//   quantity: {
//     type: Number,
//     required: true,
//     min: 0
//   },
//   unit: {
//     type: String,
//     required: true
//   },
//   expiryDate: {
//     type: Date,
//     required: true
//   },
//   category: {
//     type: String,
//     required: true,
//     enum: ['dairy', 'meat', 'vegetables', 'fruits', 'beverages', 'condiments', 'other']
//   },
//   owner: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   fridge: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Fridge',
//     required: true
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('FridgeItem', fridgeItemSchema);

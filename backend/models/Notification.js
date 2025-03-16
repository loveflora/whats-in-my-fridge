const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['invitation', 'expiry', 'groupJoin', 'system'],
    default: 'system'
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  related: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60 // 30일 후 자동 삭제
  }
});

module.exports = mongoose.model('Notification', notificationSchema);

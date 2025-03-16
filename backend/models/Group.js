const mongoose = require('mongoose');
const crypto = require('crypto');

const groupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(6).toString('hex')
  },
  inviteCodeExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7일 후 만료
  },
  fridge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FridgeItem',
    required: true
  }
}, { timestamps: true });

// 새로운 초대 코드 생성 메서드
groupSchema.methods.generateNewInviteCode = function() {
  this.inviteCode = crypto.randomBytes(6).toString('hex');
  this.inviteCodeExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일 후 만료
  return this.inviteCode;
};

// 초대 코드 유효성 검사 메서드
groupSchema.methods.isInviteCodeValid = function() {
  return this.inviteCodeExpiry > new Date();
};

module.exports = mongoose.model('Group', groupSchema);

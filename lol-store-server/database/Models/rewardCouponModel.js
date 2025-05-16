// models/RewardCoupon.js

const mongoose = require('mongoose');

const rewardCouponSchema = new mongoose.Schema({
  userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  presetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RewardCouponPreset',
      required: true
  },
  code: {
      type: String,
      required: true,
      unique: true
  },
  currentUses: {
      type: Number,
      default: 0,
      min: 0
  },
  isActive: {
      type: Boolean,
      default: true
  },
  entryId:{
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardCoupon', rewardCouponSchema);

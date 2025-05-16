// models/RewardCouponPreset.js
const mongoose = require('mongoose');

const rewardCouponPresetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  maxUses: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  validDays: {
    type: Number,
    required: true,
    default: 30
  },
  rpPrice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RPPrice',
    required: false,
    default: null
  },
  rpType: {
    type: String,
    enum: ['seguro', 'barato', 'ambos'],
    required: true,
    default: 'ambos'
  },
  type: {
    type: String,
    enum: ['lootbox', 'store'],
    required: true,
  },
  gold: {
    type: Number,
    required: false,
  },
  // Nuevo campo: indica si el cupón se aplica a items, skins o ambos.
  applicableTo: {
    type: String,
    enum: ['items', 'skins', 'ambos'],
    required: true,
    default: 'ambos'
  },
  // Nuevo campo: cantidad máxima a la que se aplica el cupón.  
  // Se requiere si rpPrice es distinto de null; de lo contrario puede quedar null.
  maxApplicableSkins: {
    type: Number,
    required: function() {
      return this.rpPrice != null;
    },
    default: null,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('RewardCouponPreset', rewardCouponPresetSchema);

// models/lootboxPurchaseModel.js

const mongoose = require('mongoose');

const lootboxPurchaseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lootboxId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lootbox',
    required: true
  },
  itemReceived: {
    itemType: {
      type: String,
      required: true,
      enum: ['Skin', 'Item', 'RewardCouponPreset', 'Gold', 'FragmentsPreset']
    },
    // Para Skin/Item/FragmentsPreset es un ObjectId,
    // para RewardCouponPreset puede ser un ObjectId
    // para Gold o Preset a veces es null o número, etc.
    itemId: {
      type: mongoose.Schema.Types.Mixed,
      required: function () {
        // Solo obligatorio si itemType es Skin, Item o FragmentsPreset
        return ['Skin', 'Item', 'FragmentsPreset'].includes(this.itemReceived.itemType);
      },
      default: null,
      validate: {
        validator: function (value) {
          if (['Skin', 'Item', 'FragmentsPreset'].includes(this.itemReceived.itemType)) {
            return mongoose.Types.ObjectId.isValid(value);
          }
          // Para RewardCouponPreset o Gold, aceptamos string/number/null
          return (typeof value === 'string' || typeof value === 'number' || value === null);
        },
        message: function (props) {
          return `${props.value} no es un identificador válido para el tipo ${this.itemReceived.itemType}`;
        }
      }
    },
    quantity: {
      type: Number,
      required: true
    },
    details: {
      type: Object,
      default: {}
    },
    dropRate: { 
      type: Number 
    },
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  goldSpent: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('LootboxPurchase', lootboxPurchaseSchema);

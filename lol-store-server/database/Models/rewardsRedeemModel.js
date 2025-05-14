// models/rewardsRedeemModel.js
const mongoose = require('mongoose');
const Status = require('./statusModel');
const Currency = require('./currencyModel');

const rewardsRedeemSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'items.itemType',
      required: true
    },
    itemType: {
      type: String,
      required: true,
      enum: ['Skin', 'Item', 'Unranked']
    },
  }],
  status: {
    statusId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Status',
      required: true
    },
    estadoConfirmado: {
      type: Boolean,
      default: false
    },
    confirmadoEn: {
      type: Date,
      default: null
    }
  },
  redeemDate: {
    type: Date,
    default: Date.now
  },
  riotName: {
    type: String,
    required: true,
  },
  discordName: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    enum: ['NA', 'EUW', 'EUNE', 'KR', 'JP', 'LAN', 'LAS', 'BR', 'OCE'],
    required: true,
  },
  statusChangedAt: Date,
  statusChangeViewed: { 
    type: Boolean, 
    default: false 
  },
  timerEndTime: {
    type: Date,
    default: null
  },
});

// Middleware para asignar el status por defecto
rewardsRedeemSchema.pre('save', async function(next) {
  if (!this.status.statusId) {
    try {
      const defaultStatus = await Status.findOne({ default: true });
      if (defaultStatus) {
        this.status = {
          statusId: defaultStatus._id,
          estadoConfirmado: false,
          confirmadoEn: null
        };
      } else {
        throw new Error('No se encontró un status por defecto');
      }
    } catch (err) {
      return next(err);
    }
  }
  next();
});

module.exports = mongoose.model('rewardsRedeem', rewardsRedeemSchema);

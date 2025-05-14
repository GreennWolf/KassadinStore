// models/purchaseModel.js
const mongoose = require('mongoose');
const Status = require('./statusModel');
const Currency = require('./currencyModel');

const purchaseSchema = new mongoose.Schema({
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
    isSeguro: {
      type: Boolean,
      required: true,
      default: true,
    },
    quantity: {
      type: Number,
      required: true
    },
    accountData: {
      type: {
        email: String,
        password: String
      },
      default: null
    }
  }],
  progressProcessed: {
    type: Boolean,
    default: false
  },
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
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  receipt: {
    type: String,
    required: true,
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
  Total: {
    type: Number,
    required: true,
  },
  currencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Currency',
    required: true
  },
  originalPrice: { 
    type: Number, 
    required: true 
  },
  discountAmount: { 
    type: Number, 
    default: 0 
  },
  // Para cupón normal se almacena su ObjectId
  cupon: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cupon',
    default: null,
  },
  // Para reward coupon se almacena el código (string)
  rewardCoupon: {
    type: String,
    default: null
  },
  // Indica qué tipo de cupón se usó: 'normal' o 'reward'
  couponType: {
    type: String,
    enum: ['normal', 'reward'],
    default: null
  },
  totalRP: {
    type: Number,
    required: true,
  },
  statusChangedAt: Date,
  statusChangeViewed: { 
    type: Boolean, 
    default: false 
  },
  earnedXp: {
    type: Number,
    required: true,
    default: 0
  },
  rankUpgrade: {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ranks'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ranks'
    },
    goldEarned: {
      type: Number
    }
  },
  timerEndTime: {
    type: Date,
    default: null
  },
});

// Middleware para asignar el status por defecto
purchaseSchema.pre('save', async function(next) {
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

module.exports = mongoose.model('Purchase', purchaseSchema);

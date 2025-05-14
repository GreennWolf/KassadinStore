// models/lootboxModel.js

const mongoose = require('mongoose');

const lootboxItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Skin', 'Item', 'RewardCouponPreset', 'Gold', 'FragmentsPreset'],
    required: true
  },
  // Mixed permite almacenar tanto ObjectId como string/number para Gold
  itemId: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (value) {
        if (this.itemType === 'Skin' || this.itemType === 'Item' || this.itemType === 'FragmentsPreset') {
          return mongoose.Types.ObjectId.isValid(value);
        }
        // Para Gold o RewardCouponPreset, puede ser un string o número
        return typeof value === 'string' || typeof value === 'number';
      },
      message: function (props) {
        return `${props.value} no es un identificador válido para el tipo ${this.itemType}`;
      }
    }
  },
  dropRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    validate: {
      validator: Number.isInteger,
      message: '{VALUE} debe ser un número entero'
    }
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  color: {
    type: String,
    default: "#FFFFFF"  // Color blanco como predeterminado para los items
  },
  details: {
    type: Object,
    default: {}
  }
});

const lootboxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  color: {  // Nuevo campo
    type: String,
    default: "#808080"  // Color gris como predeterminado
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  items: {
    type: [lootboxItemSchema],
    validate: {
      validator: function (items) {
        const totalDropRate = items.reduce((sum, item) => sum + item.dropRate, 0);
        return totalDropRate === 100;
      },
      message: 'La suma de las tasas de drop debe ser 100%'
    }
  },
  active: {
    type: Boolean,
    default: true
  },
  purchaseLimit: {
    type: Number,
    default: null
  },
  minimumRank: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ranks',
    default: null
  },
  endDate: {
    type: Date,
    default: null
  }
});

// Middleware pre-save para prevenir duplicados
lootboxSchema.pre('save', function (next) {
  const itemMap = new Map();
  for (const item of this.items) {
    const key = `${item.itemType}-${item.itemId}`;
    if (itemMap.has(key)) {
      return next(new Error('No puede haber items duplicados en la lootbox'));
    }
    itemMap.set(key, true);
  }
  next();
});

// Método para elegir un item basándonos en las probabilidades
lootboxSchema.methods.rollItem = function () {
  const random = Math.random() * 100;
  let accumulator = 0;
  for (const item of this.items) {
    accumulator += item.dropRate;
    if (random <= accumulator) {
      return item;
    }
  }
  // fallback en caso de cualquier cosa
  return this.items[this.items.length - 1];
};

module.exports = mongoose.model('Lootbox', lootboxSchema);
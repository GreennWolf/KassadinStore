// inventoryModel.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const inventoryItemSchema = new mongoose.Schema({
  // Campo para identificar de forma única cada entrada (útil para cupones)
  entryId: {
    type: String,
    default: () => uuidv4(),
  },
  itemType: {
    type: String,
    enum: ['Skin', 'Item', 'RewardCouponPreset', 'FragmentsUser'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'itemType',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  obtainedFrom: {
    type: String,
    enum: ['purchase', 'reward', 'gift', 'claim'],
    required: true,
  },
  obtainedAt: {
    type: Date,
    default: Date.now,
  },
  goldSpent: {
    type: Number,
    default: 0,
  },
  claimed: {
    type: Boolean,
    default: false,
  },
  // Campo para almacenar detalles adicionales (útil para fragmentos)
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const usedItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ['Skin', 'Item', 'RewardCouponPreset', 'FragmentsUser', 'FragmentsPreset'],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    // CORREGIDO: Debe ser 'itemType', no 'usedItems.itemType'
    refPath: 'itemType',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  obtainedFrom: {
    type: String,
    enum: ['purchase', 'reward', 'gift', 'claim'],
    required: true,
  },
  obtainedAt: {
    type: Date,
    required: true,
  },
  usedAt: {
    type: Date,
    default: Date.now,
  },
  goldSpent: {
    type: Number,
    default: 0,
  },
  // Campo para almacenar detalles adicionales
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  }
});

const inventorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  activeItems: [inventoryItemSchema],
  usedItems: [usedItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

// Método para agregar un ítem al inventario
inventorySchema.methods.addItem = async function({ itemType, itemId, quantity, obtainedFrom, goldSpent, claimed, details }) {
  if (itemType === "RewardCouponPreset") {
    // Para cupones, siempre se agrega una entrada nueva sin fusionar
    this.activeItems.push({
      itemType,
      itemId,
      quantity,
      obtainedFrom,
      goldSpent,
      claimed,
      details,
      obtainedAt: new Date()
    });
  } else {
    // Para otros ítems, se fusiona si existe una entrada con el mismo itemType e itemId
    const existingItem = this.activeItems.find(item =>
      item.itemType === itemType &&
      item.itemId.toString() === itemId.toString()
    );
    if (existingItem) {
      existingItem.quantity += quantity;
      // Actualizar details si se proporcionan
      if (details) {
        existingItem.details = { ...existingItem.details, ...details };
      }
    } else {
      this.activeItems.push({
        itemType,
        itemId,
        quantity,
        obtainedFrom,
        goldSpent,
        claimed,
        details,
        obtainedAt: new Date()
      });
    }
  }
  this.lastUpdated = new Date();
  return this.save();
};

// Método para usar un ítem
inventorySchema.methods.useItem = async function(itemId, quantity = 1, claimed = false) {
  const itemIndex = this.activeItems.findIndex(item =>
    item._id.toString() === itemId.toString()
  );
  
  if (itemIndex === -1) {
    throw new Error('Item no encontrado en el inventario');
  }
  
  const item = this.activeItems[itemIndex];
  
  if (item.quantity < quantity) {
    throw new Error('Cantidad insuficiente del item');
  }
  
  // Registrar el ítem usado
  this.usedItems.push({
    itemType: item.itemType,
    itemId: item.itemId,
    quantity: quantity,
    obtainedFrom: item.obtainedFrom,
    obtainedAt: item.obtainedAt,
    goldSpent: item.goldSpent,
    details: item.details,
    claimed,
    usedAt: new Date()
  });
  
  // Actualizar la cantidad del ítem en el inventario activo
  item.quantity -= quantity;
  
  // Solo eliminar el ítem específico si su cantidad llega a 0
  if (item.quantity === 0) {
    this.activeItems.splice(itemIndex, 1);
  }
  
  this.lastUpdated = new Date();
  return this.save();
};

inventorySchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

inventorySchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Inventory', inventorySchema);
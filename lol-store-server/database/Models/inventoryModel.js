// models/inventoryModel.js
const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ['Skin', 'Item', 'Cupon', 'Gold'],
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'itemType',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    obtainedFrom: {
        type: String,
        enum: ['Lootbox', 'Reward', 'Purchase', 'Gift'],
        required: true
    },
    obtainedAt: {
        type: Date,
        default: Date.now
    },
    expiresAt: {
        type: Date,
        default: null
    },
    used: {
        type: Boolean,
        default: false
    },
    usedAt: {
        type: Date,
        default: null
    }
});

const inventorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    items: [inventoryItemSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Método para añadir items al inventario
inventorySchema.methods.addItem = async function(item) {
    // Si es un item stackeable (como Gold), sumar a la cantidad existente
    if (item.itemType === 'Gold') {
        const existingGold = this.items.find(i => 
            i.itemType === 'Gold' && !i.used && (!i.expiresAt || i.expiresAt > new Date())
        );
        
        if (existingGold) {
            existingGold.quantity += item.quantity;
        } else {
            this.items.push(item);
        }
    } else {
        // Para otros items, agregar como nuevo
        this.items.push(item);
    }
    
    this.lastUpdated = new Date();
    return this.save();
};

// Método para usar un item
inventorySchema.methods.useItem = async function(itemId) {
    const item = this.items.id(itemId);
    if (!item) throw new Error('Item no encontrado');
    if (item.used) throw new Error('Item ya utilizado');
    if (item.expiresAt && item.expiresAt < new Date()) 
        throw new Error('Item expirado');

    item.used = true;
    item.usedAt = new Date();
    this.lastUpdated = new Date();
    
    return this.save();
};

// Método para obtener items disponibles (no usados y no expirados)
inventorySchema.methods.getAvailableItems = function() {
    const now = new Date();
    return this.items.filter(item => 
        !item.used && (!item.expiresAt || item.expiresAt > now)
    );
};

// Middleware para limpiar items expirados periódicamente
inventorySchema.pre('save', function(next) {
    const now = new Date();
    this.items = this.items.filter(item => 
        !item.expiresAt || item.expiresAt > now || item.used
    );
    next();
});

module.exports = mongoose.model('Inventory', inventorySchema);
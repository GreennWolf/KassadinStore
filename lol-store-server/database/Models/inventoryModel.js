const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ['Skin', 'Item'], // Cambiado para coincidir con los nombres de los modelos
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'activeItems.itemType',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    obtainedFrom: {
        type: String,
        enum: ['purchase', 'reward', 'gift'],
        required: true
    },
    obtainedAt: {
        type: Date,
        default: Date.now
    },
    goldSpent: {
        type: Number,
        default: 0
    }
});

const usedItemSchema = new mongoose.Schema({
    itemType: {
        type: String,
        enum: ['Skin', 'Item'], // Cambiado para coincidir con los nombres de los modelos
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'usedItems.itemType',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    obtainedFrom: {
        type: String,
        enum: ['purchase', 'reward', 'gift'],
        required: true
    },
    obtainedAt: {
        type: Date,
        required: true
    },
    usedAt: {
        type: Date,
        default: Date.now
    },
    goldSpent: {
        type: Number,
        default: 0
    }
});

const inventorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    activeItems: [inventoryItemSchema],
    usedItems: [usedItemSchema],
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Añadido para tener createdAt y updatedAt
});

// Método para añadir items al inventario
inventorySchema.methods.addItem = async function({ itemType, itemId, quantity, obtainedFrom, goldSpent }) {
    const existingItem = this.activeItems.find(item => 
        item.itemType === itemType && 
        item.itemId.toString() === itemId.toString()
    );
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        this.activeItems.push({
            itemType,
            itemId,
            quantity,
            obtainedFrom,
            goldSpent
        });
    }
    
    this.lastUpdated = new Date();
    return this.save();
};

// Método para usar un item
inventorySchema.methods.useItem = async function(itemId, quantity = 1) {
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

    item.quantity -= quantity;

    this.usedItems.push({
        itemType: item.itemType,
        itemId: item.itemId,
        quantity: quantity,
        obtainedFrom: item.obtainedFrom,
        obtainedAt: item.obtainedAt,
        goldSpent: item.goldSpent
    });

    if (item.quantity === 0) {
        this.activeItems.splice(itemIndex, 1);
    }

    this.lastUpdated = new Date();
    return this.save();
};

// Método para obtener el historial completo
inventorySchema.methods.getHistory = function() {
    return [...this.activeItems, ...this.usedItems].sort((a, b) => 
        b.obtainedAt - a.obtainedAt
    );
};

// Método para verificar si un item existe en el inventario
inventorySchema.methods.hasItem = function(itemId) {
    return this.activeItems.some(item => 
        item.itemId.toString() === itemId.toString()
    );
};

// Método para obtener la cantidad de un item específico
inventorySchema.methods.getItemQuantity = function(itemId) {
    const item = this.activeItems.find(item => 
        item.itemId.toString() === itemId.toString()
    );
    return item ? item.quantity : 0;
};

// Virtual para obtener el valor total del inventario
inventorySchema.virtual('totalValue').get(function() {
    return this.activeItems.reduce((total, item) => 
        total + (item.goldSpent * item.quantity), 0
    );
});

// Middleware pre-save para actualizar lastUpdated
inventorySchema.pre('save', function(next) {
    this.lastUpdated = new Date();
    next();
});

// Índices para optimizar las búsquedas
inventorySchema.index({ userId: 1 });
inventorySchema.index({ 'activeItems.itemType': 1 });
inventorySchema.index({ 'activeItems.itemId': 1 });
inventorySchema.index({ 'usedItems.itemType': 1 });
inventorySchema.index({ 'usedItems.itemId': 1 });
inventorySchema.index({ lastUpdated: -1 });

// Configuración del modelo
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
// models/lootboxModel.js
const mongoose = require('mongoose');

const lootboxItemSchema = new mongoose.Schema({
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
    price: {
        type: Number,
        required: true,
        min: 0
    },
    items: {
        type: [lootboxItemSchema],
        validate: {
            validator: function(items) {
                // Validar que la suma de dropRates sea 100%
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
        default: null // null significa sin límite
    },
    minimumRank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ranks',
        default: null // null significa sin requisito de rango
    },
    endDate: {
        type: Date,
        default: null // null significa sin fecha de expiración
    }
});

// Middleware pre-save para validar items únicos
lootboxSchema.pre('save', function(next) {
    const itemMap = new Map();
    for (const item of this.items) {
        const key = `${item.itemType}-${item.itemId}`;
        if (itemMap.has(key)) {
            next(new Error('No puede haber items duplicados en la lootbox'));
        }
        itemMap.set(key, true);
    }
    next();
});

// Método para obtener un item aleatorio basado en las probabilidades
lootboxSchema.methods.rollItem = function() {
    const random = Math.random() * 100;
    let accumulator = 0;
    
    for (const item of this.items) {
        accumulator += item.dropRate;
        if (random <= accumulator) {
            return item;
        }
    }
    
    return this.items[this.items.length - 1]; // Fallback al último item
};

module.exports = mongoose.model('Lootbox', lootboxSchema);


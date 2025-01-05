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
            required: true
        },
        itemId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'itemReceived.itemType',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
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
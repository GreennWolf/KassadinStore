const mongoose = require('mongoose');

const XpConversionSchema = new mongoose.Schema({
    rpPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true,
    },
    xpSeguro: {
        type: Number,
        required: true,
    },
    xpBarato: {
        type: Number,
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
        default: true,
    }
}, {
    timestamps: true
});

// Índice para asegurar que cada rpPrice sea único
XpConversionSchema.index({ rpPrice: 1 }, { unique: true });

module.exports = mongoose.model('XpConversion', XpConversionSchema);
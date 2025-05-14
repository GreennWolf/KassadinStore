// models/RPPriceConversion.js
const mongoose = require('mongoose');

const rpPriceConversionSchema = new mongoose.Schema({
    rpPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true,
    },
    currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency',
        required: true,
    },
    priceSeguro: {
        type: Number,
        required: true, // Precio en la divisa específica, e.g., 12.99 para USD
    },
    priceBarato: {
        type: Number,
        required: true, // Precio en la divisa específica, e.g., 12.99 para USD
    },
    active: {
        type: Boolean,
        required: true,
        default:true,
    },
}, {
    timestamps: true,
});

// Índice para asegurar que cada combinación de rpPrice y currency sea única
rpPriceConversionSchema.index({ rpPrice: 1, currency: 1 }, { unique: true });

module.exports = mongoose.model('RPPriceConversion', rpPriceConversionSchema);

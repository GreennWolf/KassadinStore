// models/RPPriceConversion.js
const mongoose = require('mongoose');

const currencyCuponSchema = new mongoose.Schema({
    cupon: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cupon',
        required: true,
    },
    currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency',
        required: true,
    },
    value: {
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


module.exports = mongoose.model('currencyCupon', currencyCuponSchema);

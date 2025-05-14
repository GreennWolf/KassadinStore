// database/Models/PaymentMethodCurrency.js
const mongoose = require('mongoose');

const paymentMethodCurrencySchema = new mongoose.Schema({
    paymentMethod: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    currencies: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency'
    }],
    isRestricted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

paymentMethodCurrencySchema.index({ paymentMethod: 1 }, { unique: true });

module.exports = mongoose.model('PaymentMethodCurrency', paymentMethodCurrencySchema);
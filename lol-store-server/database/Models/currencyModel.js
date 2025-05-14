// models/Currency.js
const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Nombre completo de la divisa, e.g., "Dólar Estadounidense"
    },
    code: {
        type: String,
        required: true, // Código ISO, e.g., "USD"
        unique: true,
    },
    symbol: {
        type: String,
        required: true, // Símbolo de la divisa, e.g., "$"
    },
    src: {
        type: String,
        default: '',
    },
    active:{
        type:Boolean,
        default:true,   
        required:true,
    }
});

module.exports = mongoose.model('Currency', currencySchema);

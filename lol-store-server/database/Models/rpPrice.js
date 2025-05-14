// models/RPPrice.js
const mongoose = require('mongoose');

const rpPriceSchema = new mongoose.Schema({
    valueRP: {
        type: Number,
        required: true,
        unique: true, // Por ejemplo, 1350 RP
    },
    active: {
        type: Boolean,
        required: true,
        default:true,
    },
});

module.exports = mongoose.model('RPPrice', rpPriceSchema);

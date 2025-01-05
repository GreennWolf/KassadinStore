const mongoose = require('mongoose');

const XpConvertionSchema = new mongoose.Schema({
    xpAmount: {
        type: Number,
        required: true,
    },
    currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency',
        required: true,
        unique:true,
    },
    currencyAmount:{
        type:Number,
        required:true,
    },
});

module.exports = mongoose.model('XpConvertion', XpConvertionSchema);


const mongoose = require('mongoose');

const GoldConvertionSchema = new mongoose.Schema({
    gold: {
        type: Number,
        required: true,
    },
    rpPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true,
        unique:true,
    },
});

module.exports = mongoose.model('GoldConvertion', GoldConvertionSchema);


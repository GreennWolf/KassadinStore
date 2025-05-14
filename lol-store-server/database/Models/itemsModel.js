const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['loot', 'icon', 'chromas', 'presale', 'tft','bundle','unrankeds'],
        required: true,
    },
    priceRP: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true,
    },
    srcWeb: {
        type: String,
        required: false,
    },
    srcLocal: {
        type: String,
        required: false,
    },
    skin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skin', // Cambiado de 'SkinId' a 'Skin'
        required: false,
    },
    reward:{
        type:Boolean,
        require:true,
        default:false,
    },
    destacado: {
        type: Boolean,
        required: true,
        default:false,
    },
    active:{
        type:Boolean,
        default:true,   
        required:true,
    }
});

module.exports = mongoose.model('Item', itemSchema);
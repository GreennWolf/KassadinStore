const mongoose = require('mongoose');

const UnrankedSchema = new mongoose.Schema({
    titulo: {
        type: String,
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
    escencia:{
        type: Number,
        default: 0,
    },
    nivel:{
        type: Number,
        required: true,
    },
    rpAmount:{
        type: Number,
        required: true,
    },
    escenciaNaranja:{
        type: Number,
        required: true,
    },
    region:{
        type: String,
        default: true,  
        enum: ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'], 
        required: true,
    },
    handUpgrade:{
        type: Boolean,
        default: true,
        required: true,
    },
    skins: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Skin',
        default: [],
    },
    stock: {
        type: Number,
        default: 1,
        required: true,
        min: 0
    },
    active:{
        type: Boolean,
        default: true,   
        required: true,
    }
});

module.exports = mongoose.model('Unranked', UnrankedSchema);
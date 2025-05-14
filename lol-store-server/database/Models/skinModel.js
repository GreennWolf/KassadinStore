// models/Skin.js
const mongoose = require('mongoose');

const skinSchema = new mongoose.Schema({
    NombreSkin: {
        type: String,
        required: true,
    },
    priceRP: { // Referencia al modelo RPPrice
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true,
    },
    src: {
        type: String,
        required: true,
    },
    srcLocal: {
        type: String,
        default: '',
    },
    champion: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Champion',
        required: true,
    },
    new:{type:Boolean},
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
    
    active: {
        type: Boolean,
        required: true,
        default:true,
    },
});

// Asegúrate de que no haya índices únicos en PrecioRP

module.exports = mongoose.model('Skin', skinSchema);

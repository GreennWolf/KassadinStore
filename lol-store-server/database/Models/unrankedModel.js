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
        type:Number,
        default:false,
    },
    nivel:{
        type:Number,
        required:true,
    },
    rpAmount:{
        type:Number,
        require:true,
    },
    escenciaNaranja:{
        type:Number,
        require:true,
    },
    region:{
        type:String,
        default:true,  
        enum: ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'], 
        required:true,
    },
    handUpgrade:{
        type:Boolean,
        default:true,
        required:true,
    },
    skins: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Skin',
        default: [],
    },
    active:{
        type:Boolean,
        default:true,   
        required:true,
    }
});

module.exports = mongoose.model('Unranked', UnrankedSchema);
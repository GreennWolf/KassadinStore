const mongoose = require('mongoose');

// Esquema para las divisiones dentro de un rango
const DivisionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        enum: ['IV', 'III', 'II', 'I']
    },
    order: {
        type: Number,
        required: true
    }
});

const EloBoostRankSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    // Orden para organizar los rangos (hierro < bronce < plata < oro, etc.)
    order: {
        type: Number,
        required: true,
        unique: true
    },
    divisions: {
        type: [DivisionSchema],
        default: [
            { name: 'IV', order: 0 },
            { name: 'III', order: 1 },
            { name: 'II', order: 2 },
            { name: 'I', order: 3 }
        ]
    },
    // Precio RP para subir desde el rango anterior (completo)
    rankUpPriceRP: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true
    },
    // Precio RP por división dentro del mismo rango
    divisionPriceRP: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RPPrice',
        required: true
    },
    active: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('EloBoostRank', EloBoostRankSchema);
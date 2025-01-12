const mongoose = require('mongoose');
const { getRankByXp } = require('../../controllers/rankController');

let defaultRankId = null;

// Inicialización: obtener el rango predeterminado al iniciar la aplicación
(async () => {
    try {
        const defaultRank = await getRankByXp(0);
        if (defaultRank) {
            defaultRankId = defaultRank._id;
        } else {
            console.error('No se encontró un rango predeterminado para XP = 0.');
        }
    } catch (error) {
        console.error('Error al obtener el rango predeterminado:', error);
    }
})();

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    perfilImage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PerfilImage',
        required: true,
    },
    active: {
        type: Boolean,
        required: true,
        default: true,
    },
    xp: {
        type: Number,
        required: true,
        default: 0,
    },
    gold: {
        type: Number,
        required: true,
        default: 0,
    },
    rank: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ranks',
        required: true,
        default: function () {
            // Asignar el rango predeterminado almacenado en `defaultRankId`
            return defaultRankId;
        },
        inventory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Inventory'
        },
    },
    verified: {
        type: Boolean,
        default: false
    },
});

module.exports = mongoose.model('User', userSchema);

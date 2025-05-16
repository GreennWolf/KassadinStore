// models/userModel.js
const mongoose = require('mongoose');

// Declaración de la variable para el rango predeterminado
let defaultRankId = null;

// Función para obtener el rango por XP (para ser importada después)
// Aquí deberías importar directamente esta función si está disponible en otro archivo
// const { getRankByXp } = require('../../controllers/rankController');
const getRankByXp = async (xp) => {
    try {
        // Implementación pendiente o puede importarse de otra parte
        // Esta es una implementación temporal - reemplazar con la real
        return null;
    } catch (error) {
        console.error('Error obteniendo rank por XP:', error);
        return null;
    }
};

// Función para obtener el rango por defecto
async function getDefaultRankId() {
    try {
        // Verificar si ya hemos cargado el defaultRankId
        if (defaultRankId) {
            return defaultRankId;
        }
        
        // Si no lo tenemos, intentar obtenerlo
        const Rank = require('./ranksModel');
        const defaultRank = await Rank.findOne({ requiredXP: 0 });
        
        if (defaultRank) {
            defaultRankId = defaultRank._id;
            return defaultRankId;
        } else {
            console.error('No se encontró un rango predeterminado para XP = 0.');
            return null;
        }
    } catch (error) {
        console.error('Error al obtener el rango predeterminado:', error);
        return null;
    }
}

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
        required: true  // Quitamos el default aquí ya que lo asignaremos explícitamente
    },
    inventory: {  // Corregido: estaba dentro de 'rank'
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory'
    },
    verified: {
        type: Boolean,
        default: false
    },
    // Agregar un campo createdAt para poder filtrarlo en el dashboard
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Uso del patrón singleton para evitar redefinir el modelo
let User;
try {
    // Intentar obtener el modelo existente
    User = mongoose.model('User');
} catch (error) {
    // Si no existe, crearlo
    User = mongoose.model('User', userSchema);
}

module.exports = User;
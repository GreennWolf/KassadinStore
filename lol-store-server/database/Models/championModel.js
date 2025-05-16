const mongoose = require('mongoose');

const championSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true,
        default: true,
    },
    // Campos para iconos y referencias
    icon: {
        type: String,
        default: ''
    },
    // ID interno de Riot para el campeón
    riotId: {
        type: String,
        default: ''
    },
    // Ruta al archivo con nombre original para compatibilidad con cliente
    originalIconPath: {
        type: String,
        default: ''
    },
    // Indica si es una entrada alternativa (para compatibilidad)
    isAlternateVersion: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Champion', championSchema);

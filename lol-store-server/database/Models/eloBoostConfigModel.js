const mongoose = require('mongoose');

const EloBoostConfigSchema = new mongoose.Schema({
    // Porcentaje extra por seleccionar una línea específica (top, jg, mid, adc, support)
    specificRolePricePercent: {
        type: Number,
        default: 10, // 10% por defecto
        required: true
    },
    // Porcentaje extra por seleccionar un campeón específico
    specificChampionPricePercent: {
        type: Number,
        default: 10, // 10% por defecto
        required: true
    },
    // Porcentaje extra por jugar en dúo con el booster
    duoQueuePricePercent: {
        type: Number,
        default: 35, // 35% por defecto
        required: true
    },
    // Líneas disponibles
    availableRoles: {
        type: [{
            name: {
                type: String,
                required: true
            },
            active: {
                type: Boolean,
                default: true
            }
        }],
        default: [
            { name: 'Top', active: true },
            { name: 'Jungle', active: true },
            { name: 'Mid', active: true },
            { name: 'ADC', active: true },
            { name: 'Support', active: true }
        ]
    },
    // Configuración global activa/inactiva
    active: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Sólo queremos un documento de configuración, así que usamos un método estático para obtenerlo
EloBoostConfigSchema.statics.getConfig = async function() {
    const config = await this.findOne({ active: true });
    if (config) {
        return config;
    }
    
    // Si no existe configuración, crear una por defecto
    return await this.create({
        specificRolePricePercent: 10,
        specificChampionPricePercent: 10,
        duoQueuePricePercent: 35,
        active: true
    });
};

module.exports = mongoose.model('EloBoostConfig', EloBoostConfigSchema);
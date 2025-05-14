// models/cuponsModel.js
const mongoose = require('mongoose');

const cuponsSchema = new mongoose.Schema({
    cupon: {
        type: String,
        required: true,
        unique: true,
    },
    type: {
        type: String,
        enum: ['fixed','percent'],
        required: true,
    },
    value: {
        type: Number,
        required: true,
        default: 0,
    },
    maxUses: {
        type: Number,
        required: true,
        default: 1,
    },
    currentUses: {
        type: Number,
        default: 0,
    },
    validFrom: {
        type: Date,
        required: true,
        default: Date.now,
    },
    validUntil: {
        type: Date,
        required: function() {
            return !this.isInfinite; // Solo es requerido si no es infinito
        }
    },
    isInfinite: {
        type: Boolean,
        default: false,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    description: {
        type: String,
        default: '',
    },
    rpType:{
        type: String,
        enum: ['seguro','barato','ambos'],
        required: true,
    }
}, {
    timestamps: true // Añade createdAt y updatedAt
});

// Middleware para validar fechas
cuponsSchema.pre('save', function(next) {
    if (!this.isInfinite && this.validUntil) {
        if (this.validUntil < this.validFrom) {
            next(new Error('La fecha de finalización debe ser posterior a la fecha de inicio'));
        }
    }
    next();
});

// Virtual para verificar si el cupón está expirado
cuponsSchema.virtual('isExpired').get(function() {
    if (this.isInfinite) return false;
    return this.validUntil < new Date();
});

// Virtual para verificar si el cupón está agotado
cuponsSchema.virtual('isExhausted').get(function() {
    if (this.maxUses === 0) return false; // 0 significa usos ilimitados
    return this.currentUses >= this.maxUses;
});

// Virtual para verificar si el cupón es válido
cuponsSchema.virtual('isValid').get(function() {
    return this.isActive && !this.isExpired && !this.isExhausted;
});

module.exports = mongoose.model('Cupons', cuponsSchema);
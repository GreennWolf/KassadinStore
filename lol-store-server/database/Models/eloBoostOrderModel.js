const mongoose = require('mongoose');

const EloBoostOrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Detalles del boost
    currentRank: {
        rank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EloBoostRank',
            required: true
        },
        division: {
            type: String,
            enum: ['IV', 'III', 'II', 'I'],
            required: true
        }
    },
    targetRank: {
        rank: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'EloBoostRank',
            required: true
        },
        division: {
            type: String,
            enum: ['IV', 'III', 'II', 'I'],
            required: true
        }
    },
    // Opciones adicionales
    queueType: {
        type: String,
        enum: ['solo', 'flex'],
        default: 'solo'
    },
    specificRole: {
        selected: {
            type: Boolean,
            default: false
        },
        role: {
            type: String,
            enum: ['Top', 'Jungle', 'Mid', 'ADC', 'Support', ''],
            default: ''
        }
    },
    specificChampion: {
        selected: {
            type: Boolean,
            default: false
        },
        champion: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Champion',
            default: null
        }
    },
    duoQueue: {
        type: Boolean,
        default: false
    },
    // Detalles de la cuenta (encriptados)
    accountDetails: {
        username: {
            type: String,
            default: ''
        },
        password: {
            type: String,
            default: ''
        },
        provided: {
            type: Boolean,
            default: false
        }
    },
    // Valores en RP
    baseRPPrice: {
        type: Number,
        required: true
    },
    totalRPPrice: {
        type: Number,
        required: true
    },
    additionalRPCost: {
        type: Number,
        default: 0
    },
    // Precios convertidos a moneda
    currency: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Currency',
        required: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    additionalCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending_payment', 'payment_confirmed', 'pending_account', 'pending_duo_confirmation', 'processing', 'completed', 'cancelled'],
        default: 'pending_payment'
    },
    // Confirmación de duo (si aplica)
    duoConfirmation: {
        confirmed: {
            type: Boolean,
            default: false
        },
        confirmedAt: {
            type: Date,
            default: null
        }
    },
    // Referencia al pago relacionado
    payment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Purchase',
        default: null
    },
    // Fechas
    startDate: {
        type: Date,
        default: null,
        // Aplicar un transformador para convertir valores vacíos o inválidos a null
        get: function(v) {
            return v === null || v === undefined || isNaN(new Date(v).getTime()) ? null : v;
        }
    },
    completionDate: {
        type: Date,
        default: null,
        // Aplicar un transformador para convertir valores vacíos o inválidos a null
        get: function(v) {
            return v === null || v === undefined || isNaN(new Date(v).getTime()) ? null : v;
        }
    },
    // Campo para notas o comentarios
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('EloBoostOrder', EloBoostOrderSchema);
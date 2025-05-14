// models/statusModel.js
const mongoose = require('mongoose');

// Schema para las acciones de confirmación
const confirmationActionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['startTimer', 'changeStatus', 'none'],
        required: true
    },
    config: {
        // Para startTimer
        time: {
            type: Number,  // tiempo en minutos
            required: function() {
                return this.type === 'startTimer';
            }
        },
        // Para changeStatus
        targetStatus: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Status',
            required: function() {
                return this.type === 'changeStatus';
            }
        }
    }
}, { _id: false });

const statusSchema = new mongoose.Schema({
    status: {  // Cambiar 'status' a 'name' para que coincida con las referencias
        type: String,
        required: true,
        unique: true,
    },
    default: {
        type: Boolean,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    color: {
        type: String,
        required: true,
    },
    confirmacion: {
        type: Boolean,
        required: true,
        default: false,
    },
    confirmacionText: {
        type: String,
        required: true,
        default: 'Confirmar',
    },
    confirmationAction: {
        type: confirmationActionSchema,
        required: function() {
            return this.confirmacion === true;
        }
    },
    active: {
        type: Boolean,
        required: true,
        default: true,
    },
});

// Middleware para garantizar que solo haya un estado con `default: true`
statusSchema.pre('save', async function(next) {
    if (this.default) {
        const existingDefault = await this.constructor.findOne({ default: true });
        if (existingDefault && existingDefault._id.toString() !== this._id.toString()) {
            existingDefault.default = false;
            await existingDefault.save();
        }
    }
    next();
});

// Middleware para validar que no haya referencias circulares en changeStatus
statusSchema.pre('save', async function(next) {
    if (this.confirmationAction?.type === 'changeStatus') {
        if (this.confirmationAction.config.targetStatus?.toString() === this._id?.toString()) {
            throw new Error('Un estado no puede cambiar a sí mismo como acción de confirmación');
        }
    }
    next();
});

// Método estático para validar que no haya ciclos en los cambios de estado
statusSchema.statics.validateStatusChain = async function(startStatusId) {
    const visited = new Set();
    let currentStatusId = startStatusId;

    while (currentStatusId) {
        if (visited.has(currentStatusId.toString())) {
            throw new Error('Se detectó un ciclo en la cadena de cambios de estado');
        }

        visited.add(currentStatusId.toString());
        const currentStatus = await this.findById(currentStatusId);
        
        if (!currentStatus) break;
        
        if (currentStatus.confirmationAction?.type === 'changeStatus') {
            currentStatusId = currentStatus.confirmationAction.config.targetStatus;
        } else {
            break;
        }
    }
};

// Uso del patrón singleton para evitar redefinir el modelo
let Status;
try {
    // Intentar obtener el modelo existente
    Status = mongoose.model('Status');
} catch (error) {
    // Si no existe, crearlo
    Status = mongoose.model('Status', statusSchema);
}

module.exports = Status;
const mongoose = require('mongoose');

const fragmentsUserSchema = new mongoose.Schema({
  fragmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FragmentsPreset',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Cantidad de fragmentos que tiene el usuario para ese preset
  fragmentQuantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Id de la entrada (por ejemplo, si se registra algún intercambio o evento)
  entryId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.FragmentsUser || mongoose.model('FragmentsUser', fragmentsUserSchema);

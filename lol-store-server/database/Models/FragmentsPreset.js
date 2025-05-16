const mongoose = require('mongoose');

const fragmentsPresetSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  // Indica si es para una recompensa específica o por rpType
  type: {
    type: String,
    enum: ['especifico', 'rptype'],
    required: true
  },
  // Tipo de recompensa, por ejemplo: 'skin', 'chroma', 'item', 'loot', etc.
  rewardType: {
    type: String,
    enum: ['skin','loot', 'icon', 'chromas', 'presale', 'tft','bundle','unrankeds'],
    required: true
  },
  // Cantidad necesaria para canjear este fragmento
  requiredQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  // Si es de tipo "especifico", se asocia el fragmento a un item concreto (skin o item)
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    // Puedes definir ref según tu modelo; por ejemplo, 'Skin' o 'Item'
    required: function() {
      return this.type === 'especifico';
    }
  },
  // Si es de tipo "rptype", se asocia a un rpId (por ejemplo, de un precio RP)
  rpId: {
    type: mongoose.Schema.Types.ObjectId,
    // ref: 'RPPrice' u otro modelo según corresponda
    required: function() {
      return this.type === 'rptype';
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.models.FragmentsPreset || mongoose.model('FragmentsPreset', fragmentsPresetSchema);


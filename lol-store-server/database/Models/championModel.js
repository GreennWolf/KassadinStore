const mongoose = require('mongoose');

const championSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    active: {
        type: Boolean,
        required: true,
        default:true,
    },
    // Otros campos si es necesario
});

module.exports = mongoose.model('Champion', championSchema);

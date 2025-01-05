const mongoose = require('mongoose');

const PerfilImageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    src: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model('PerfilImage', PerfilImageSchema);


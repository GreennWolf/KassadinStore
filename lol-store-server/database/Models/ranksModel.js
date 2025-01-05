const mongoose = require('mongoose');

const RankSchemas = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    xp:{
        type:Number,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    gold:{
        type:Number,
        required: true,
    }
});

module.exports = mongoose.model('Ranks', RankSchemas);


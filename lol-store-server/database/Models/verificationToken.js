const mongoose = require('mongoose');

const verificationTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    },
    type:{
        type:String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // El token expirará después de 1 hora
    }
});

module.exports = mongoose.model('VerificationToken', verificationTokenSchema);
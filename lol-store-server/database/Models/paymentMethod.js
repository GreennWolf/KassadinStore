// models/PaymentMethod.js
const mongoose = require('mongoose');

const paymentDetailSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
}, { _id: false }); // _id: false para evitar IDs innecesarios en subdocumentos

const paymentMethodSchema = new mongoose.Schema({
    method: {
        type: String,
        required: true
    },
    details: [paymentDetailSchema], // Arreglo de objetos con title y description
    active:{
        type:Boolean,
        default:true,   
        required:true,
    }
});

module.exports = mongoose.model('PaymentMethod', paymentMethodSchema);

const express = require('express');
const {
    createPaymentMethod,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    activePaymentMethod
} = require('../controllers/paymentMethodController');

const router = express.Router();

// Ruta para crear un nuevo método de pago
router.post('/create', createPaymentMethod);

// Ruta para listar todos los métodos de pago
router.get('/getAll', getAllPaymentMethods);

// Ruta para actualizar un método de pago existente
router.put('/edit/:id', updatePaymentMethod);

//Activar metodo de pago
router.put('/active/:id', activePaymentMethod);

// Ruta para eliminar un método de pago
router.delete('/delete/:id', deletePaymentMethod);

module.exports = router;

const express = require('express');
const router = express.Router();
const paymentMethodCurrencyController = require('../controllers/paymentMethodCurrencyController');

// Rutas para la gestión de relaciones entre métodos de pago y divisas
router.post('/set', paymentMethodCurrencyController.setPaymentMethodCurrencies);
router.get('/available/:paymentMethodId', paymentMethodCurrencyController.getAvailableCurrencies);
router.get('/all', paymentMethodCurrencyController.getAllPaymentMethodCurrencies);
router.delete('/restrictions/:paymentMethodId', paymentMethodCurrencyController.removeRestrictions);

module.exports = router;
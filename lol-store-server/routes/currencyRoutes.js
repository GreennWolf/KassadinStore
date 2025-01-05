// routes/currencyRoutes.js
const express = require('express');
const router = express.Router();
const currencyController = require('../controllers/currencyController');

// Rutas actualizadas para manejar la carga de archivos
router.post('/create', currencyController.upload.single('image'), currencyController.createCurrency);
router.get('/getById/:id', currencyController.getCurrencyById);
router.get('/getAll', currencyController.getAllCurrencies);
router.put('/update/:id', currencyController.upload.single('image'), currencyController.updateCurrency);
router.delete('/delete/:id', currencyController.deleteCurrency);
router.put('/active/:id', currencyController.activeCurrency);

module.exports = router;
// routes/rpPriceConversionRoutes.js
const express = require('express');
const router = express.Router();
const {
    createRPPriceConversion,
    getAllRPPriceConversions,
    updateRPPriceConversion,
    deleteRPPriceConversion,
    convertRPtoCurrency,
    activeRPPriceConversion,
} = require('../controllers/rpPriceConversionController');

// Crear una nueva conversión
router.post('/create', createRPPriceConversion);

// Obtener todas las conversiones
router.get('/getAll', getAllRPPriceConversions);

// Actualizar una conversión existente
router.put('/edit/:id', updateRPPriceConversion);

// Eliminar una conversión
router.delete('/delete/:id', deleteRPPriceConversion);

// activar una conversión
router.put('/active/:id', activeRPPriceConversion);

// Convertir RP a divisa
router.post('/convert', convertRPtoCurrency);

module.exports = router;

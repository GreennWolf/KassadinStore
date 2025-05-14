const express = require('express');
const router = express.Router();
const {
    getAllXpConversions,
    createXpConversion,
    updateXpConversion,
    deleteXpConversion
} = require('../controllers/xpConvertionController');

// Rutas básicas para manejo de conversiones XP
router.get('/', getAllXpConversions);

// Rutas protegidas (requieren permisos de administrador)
router.post('/', createXpConversion);
router.put('/:id', updateXpConversion);
router.delete('/:id', deleteXpConversion);

module.exports = router;
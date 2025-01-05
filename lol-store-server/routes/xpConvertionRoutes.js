const express = require('express');
const router = express.Router();
const {
    getAllXpConvertions,
    createXpConvertion,
    updateXpConvertion,
    deleteXpConvertion
} = require('../controllers/xpConvertionController');

// Rutas públicas (solo requieren estar autenticado)
router.get('/', getAllXpConvertions);

// Rutas protegidas (requieren permisos de administrador)
router.post('/', createXpConvertion);
router.put('/:id', updateXpConvertion);
router.delete('/:id', deleteXpConvertion);

module.exports = router;
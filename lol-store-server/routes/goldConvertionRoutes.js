const express = require('express');
const router = express.Router();
const {
    getAllGoldConvertions,
    createGoldConvertion,
    updateGoldConvertion,
    deleteGoldConvertion
} = require('../controllers/goldConvertionController');

// Rutas públicas (solo requieren estar autenticado)
router.get('/', getAllGoldConvertions);

// Rutas protegidas (requieren permisos de administrador)
router.post('/', createGoldConvertion);
router.put('/:id', updateGoldConvertion);
router.delete('/:id', deleteGoldConvertion);

module.exports = router;
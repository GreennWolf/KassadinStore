const express = require('express');
const router = express.Router();
const {
    getAllRanks,
    createRank,
    updateRank,
    deleteRank,
    getNextRank
} = require('../controllers/rankController');
const upload = require('../middlewares/uploadRankIcon')

// Rutas públicas (solo requieren estar autenticado)
router.get('/', getAllRanks);
router.get('/next/:currentXp', getNextRank);

// Rutas protegidas (requieren permisos de administrador)
router.post('/', upload.single("icon"), createRank);
router.put('/:id', upload.single("icon"), updateRank);
router.delete('/:id',  deleteRank);

module.exports = router;
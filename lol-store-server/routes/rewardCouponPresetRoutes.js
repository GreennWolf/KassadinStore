const express = require('express');
const router = express.Router();
const rewardCouponPresetController = require('../controllers/rewardCouponPresetController');

// Crear un nuevo preset de cupones de recompensa
router.post('/create', rewardCouponPresetController.createRewardCouponPreset);

// Obtener un preset de cupones por ID
router.get('/:id', rewardCouponPresetController.getRewardCouponPresetById);

// Obtener un preset de cupones por tipo
router.get("/type/:type", rewardCouponPresetController.getCouponByType);

// Obtener todos los presets de cupones
router.get('/', rewardCouponPresetController.getAllRewardCouponPresets);

// Actualizar un preset de cupones
router.put('/update/:id', rewardCouponPresetController.updateRewardCouponPreset);

// Eliminar un preset de cupones
router.delete('/delete/:id', rewardCouponPresetController.deleteRewardCouponPreset);

module.exports = router;
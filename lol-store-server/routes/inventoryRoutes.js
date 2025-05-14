// routes/inventoryRoutes.js
const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// 1. Obtener información de inventario
router.get('/active/:userId', inventoryController.getActiveItems);
router.get('/used/:userId', inventoryController.getUsedItems);
router.get('/history/:userId', inventoryController.getFullHistory);

// 2. Operaciones con ítems (Skin/Item)
router.post('/purchase', inventoryController.purchaseItem);
router.post('/use', inventoryController.useItem);
router.post('/can-purchase', inventoryController.canPurchaseItem);

// 3. Reward Coupons (basados en Presets)
router.post('/claim-reward-coupon', inventoryController.claimRewardCoupon);
router.get('/coupons/:userId', inventoryController.getUserRewardCoupons);
router.put('/use-reward-coupon/:id', inventoryController.useRewardCoupon);

router.get("/coupons/:userId", inventoryController.getRewardCouponsByUserId);
router.post("/claimFragment", inventoryController.claimFragment);

module.exports = router;

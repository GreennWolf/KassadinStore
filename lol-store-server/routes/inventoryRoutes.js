const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Rutas para obtener información del inventario
router.get('/active/:userId', inventoryController.getActiveItems);
router.get('/used/:userId', inventoryController.getUsedItems);
router.get('/history/:userId', inventoryController.getFullHistory);

// Rutas para operaciones con items
router.post('/purchase', inventoryController.purchaseItem);
router.post('/use', inventoryController.useItem);
router.post('/can-purchase', inventoryController.canPurchaseItem);

module.exports = router;
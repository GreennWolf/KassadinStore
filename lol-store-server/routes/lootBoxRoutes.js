// routes/lootboxRoutes.js
const express = require('express');
const router = express.Router();
const lootboxController = require('../controllers/lootBoxController');

// Rutas públicas / usuario final
router.get('/available/:userId', lootboxController.getAvailableLootboxes);
router.get('/history/:userId', lootboxController.getUserLootboxHistory);
router.post('/open/:lootboxId', lootboxController.openLootbox);

// Rutas de administración
router.get('/', lootboxController.getAllLootboxes);
router.get('/:id', lootboxController.getLootboxById);
router.post('/create', lootboxController.upload.single('image'), lootboxController.createLootbox);
router.put('/edit/:id', lootboxController.upload.single('image'), lootboxController.updateLootbox);
router.put('/deactivate/:id', lootboxController.deactivateLootbox);

module.exports = router;

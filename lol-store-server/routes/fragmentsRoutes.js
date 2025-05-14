const express = require('express');
const router = express.Router();
const fragmentsController = require('../controllers/fragmentsController');

// Rutas para los presets de fragmentos
router.post('/presets', fragmentsController.createFragmentsPreset);
router.get('/presets', fragmentsController.getFragmentsPresets);
router.put('/presets/:id', fragmentsController.updateFragmentsPreset);
router.delete('/presets/:id', fragmentsController.deleteFragmentsPreset);

// Rutas para los fragmentos de usuario
router.get('/user/:userId', fragmentsController.getUserFragments);
router.put('/user/:userId/:fragmentId', fragmentsController.updateUserFragments);

// Ruta para canjear fragmentos (exchange)
router.post('/exchange/:userId/:presetId', fragmentsController.exchangeFragments);

module.exports = router;

const express = require('express');
const router = express.Router();
const { unrankedsController, upload } = require('../controllers/unrankedController');

// Rutas públicas
router.get('/', unrankedsController.getAllUnrankeds);
router.get('/:id', unrankedsController.getUnrankedById);

// Crear nueva cuenta unranked
router.post('/', 
    upload.single('image'),
    unrankedsController.createUnranked
);

// Actualizar cuenta unranked
router.put('/:id',
    upload.single('image'),
    unrankedsController.updateUnranked
);

// Activar/Desactivar cuenta unranked
router.patch('/:id/deactivate', unrankedsController.deactivateUnranked);
router.patch('/:id/activate', unrankedsController.activateUnranked);

// Rutas para gestionar skins
router.put('/:id/set-skins', unrankedsController.setSkinsForUnranked);
router.put('/:id/add-skins', unrankedsController.addSkinsToUnranked);
router.put('/:id/remove-skins', unrankedsController.removeSkinsFromUnranked);

// Ruta para gestionar stock
router.put('/:id/update-stock', unrankedsController.updateStockUnranked);

module.exports = router;
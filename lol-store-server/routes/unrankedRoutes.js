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

module.exports = router;
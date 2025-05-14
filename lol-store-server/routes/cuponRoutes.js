const express = require('express');
const router = express.Router();
const cuponController = require('../controllers/cuponController');

// Ruta para crear un nuevo cupón
router.post('/create', cuponController.createCupon);

// Ruta para obtener todos los cupones
router.get('/all', cuponController.getAllCupons);

// Ruta para obtener un cupón por ID
router.get('/:id', cuponController.getCuponById);

// Ruta para actualizar un cupón por ID
router.put('/update/:id', cuponController.updateCupon);

// Ruta para eliminar un cupón por ID
router.delete('/delete/:id', cuponController.deleteCupon);

//Activar Cupon
router.put('/active/:id', cuponController.activeCupon);

// Ruta para validar un cupón (por código y moneda)
router.post('/validate', cuponController.validateCupon);
router.post('/validate-reward', cuponController.validateRewardCoupon);


module.exports = router;

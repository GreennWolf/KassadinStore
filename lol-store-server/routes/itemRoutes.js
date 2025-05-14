const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemsController');

// Rutas para los artículos
router.post('/create', itemController.upload.single('image'), itemController.createItem);
router.get('/getAll', itemController.getAllItems);
router.put('/update/:id', itemController.upload.single('image'), itemController.editItem);
router.delete('/delete/:id', itemController.deleteItem);
router.put('/active/:id', itemController.activeItem);
router.get('/type/:type', itemController.getItemsByType);
router.get('/get/:id', itemController.getItemById);

// Rutas para precios de RP
router.post('/rp-price/create', itemController.createRPPrice);
router.get('/rp-price/getAll', itemController.getAllRPPrices);
router.put('/rp-price/update/:id', itemController.updateRPPrice);
router.delete('/rp-price/delete/:id', itemController.deleteRPprice);
router.put('/rp-price/active/:id', itemController.activeRPprice);

router.get('/destacados', itemController.getAllDestacados);
router.put('/destacado/:id', itemController.toggleDestacado);

module.exports = router;
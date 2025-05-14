const express = require('express');
const router = express.Router();
const {
    getAllPerfilImages,
    createPerfilImage,
    updatePerfilImage,
    deletePerfilImage,
    createDefaultProfileImage
} = require('../controllers/perfilImageController');
const {uploadMiddleware} = require('../middlewares/uploadMiddleware'); // Middleware para manejar archivos (si no estás usando express-fileupload)

// Rutas públicas (solo requieren estar autenticado)
router.get('/', getAllPerfilImages);

// Rutas protegidas (requieren permisos de administrador)
router.post('/', uploadMiddleware, createPerfilImage); // Maneja la subida de archivos e imagen
router.post('/default', uploadMiddleware, createDefaultProfileImage);
router.put('/:id', uploadMiddleware, updatePerfilImage);
router.delete('/:id', deletePerfilImage);

module.exports = router;

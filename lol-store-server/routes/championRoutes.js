// routes/championRoutes.js

const express = require('express');
const multer = require('multer');
const {
    // Controladores de campeones
    getAllChampions,
    getChampionById,
    createChampion,
    updateChampion,
    deleteChampion,
    // Controladores de skins
    getAllSkins,
    getSkinById,
    getSkinsByChampionId,
    createSkin,
    updateSkin,
    activeSkin,
    deleteSkin,
    getAllNewSkins,
    getAllDestacados,
    toggleDestacado
} = require('../controllers/championController');

const router = express.Router();

// Configuración de multer para el manejo de archivos
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB límite de tamaño
    },
    fileFilter: (req, file, cb) => {
        // Verificar tipos de archivo permitidos
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// Rutas para campeones
router.get('/champions', getAllChampions);
router.get('/champion/:id', getChampionById);
router.post('/champions/create', upload.single('championImage'), createChampion);
router.put('/champions/update/:id', upload.single('championImage'), updateChampion);
router.delete('/champions/delete/:id', deleteChampion);

// Rutas para skins
router.get('/skins', getAllSkins);
router.get('/skinsId/:id', getSkinById);
router.get('/champion/:championId/skins', getSkinsByChampionId);
router.get('/getAllNewSkins', getAllNewSkins);
router.post('/skins/create', upload.single('skinImage'), createSkin);
router.put('/skins/update/:id', upload.single('skinImage'), updateSkin);
router.delete('/skins/delete/:id', deleteSkin);
router.put('/skins/active/:id', activeSkin);
router.get('/skins/destacados', getAllDestacados);
router.put('/skins/destacado/:id', toggleDestacado);

// Middleware de manejo de errores para multer
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'El archivo es demasiado grande. Máximo 5MB permitido.'
            });
        }
        return res.status(400).json({
            message: 'Error al subir el archivo',
            error: error.message
        });
    } else if (error.message === 'Solo se permiten archivos de imagen') {
        return res.status(400).json({
            message: error.message
        });
    }
    next(error);
});

module.exports = router;
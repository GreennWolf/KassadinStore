const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');

// Middleware de configuración para express-fileupload
const uploadMiddleware = fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de tamaño: 5MB
    abortOnLimit: true,
    responseOnLimit: 'El archivo supera el tamaño máximo permitido de 5MB.',
});

// Asegura que el directorio de carga exista
function ensureUploadDirectoryExists() {
    const uploadDir = path.join(__dirname, '../public/PerfilImage');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}

// Middleware para manejar y validar la carga de archivos
function handleFileUpload(req, res, next) {
    try {
        ensureUploadDirectoryExists();

        if (!req.files || !req.files.image) {
            return res.status(400).json({
                error: 'No se proporcionó ningún archivo.',
            });
        }

        const image = req.files.image;
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;

        // Validar extensión de archivo
        if (!allowedExtensions.test(image.name)) {
            return res.status(400).json({
                error: 'El archivo debe ser una imagen válida (JPG, JPEG, PNG, GIF o WEBP).',
            });
        }

        // Guardar el archivo temporalmente en la solicitud
        req.uploadedImage = image;

        next();
    } catch (error) {
        console.error('Error al manejar el archivo:', error);
        res.status(500).json({
            error: 'Error interno al procesar el archivo.',
        });
    }
}

module.exports = {
    uploadMiddleware,
    handleFileUpload,
};

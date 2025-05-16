// errorHandler.js
const logger = require('../utils/logger');
const config = require('../config/config');

const errorHandler = (err, req, res, next) => {
    // Log detailed error information
    logger.error(`${err.name}: ${err.message}`, { 
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? req.user.id : 'Unauthenticated'
    });

    // Errores de Multer
    if (err.name === 'MulterError') {
        return res.status(400).json({
            status: 'error',
            message: 'Error al subir el archivo',
            details: err.message
        });
    }

    // Errores de Mongoose/MongoDB
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            status: 'error',
            message: 'Error de validación',
            details: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            status: 'error',
            message: 'ID inválido',
            details: 'El formato del ID proporcionado no es válido'
        });
    }

    // Errores personalizados
    if (err.isCustom) {
        return res.status(err.statusCode || 400).json({
            status: 'error',
            message: err.message,
            details: err.details
        });
    }

    // Error por defecto
    return res.status(500).json({
        status: 'error',
        message: 'Error interno del servidor',
        details: config.env === 'development' ? err.message : 'Contacte al administrador'
    });
};

// CustomError.js
class CustomError extends Error {
    constructor(message, statusCode = 400, details = null) {
        super(message);
        this.isCustom = true;
        this.statusCode = statusCode;
        this.details = details;
    }
}

module.exports = { errorHandler, CustomError };
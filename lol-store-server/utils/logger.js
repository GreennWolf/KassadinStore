const fs = require('fs');
const path = require('path');
const util = require('util');

// Configuración básica del logger
const LOG_DIR = path.join(__dirname, '..', 'logs');
const STOCK_LOG_FILE = path.join(LOG_DIR, 'stock-updates.log');
const ERROR_LOG_FILE = path.join(LOG_DIR, 'error.log');
const GENERAL_LOG_FILE = path.join(LOG_DIR, 'server.log');

// Asegurar que el directorio de logs exista
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Formatea un mensaje para el log
const formatLogMessage = (message) => {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${typeof message === 'object' ? util.inspect(message, { depth: null }) : message}\n`;
};

// Escribe en un archivo de log específico
const writeToLogFile = (filePath, message) => {
    try {
        fs.appendFileSync(filePath, formatLogMessage(message));
    } catch (error) {
        console.error(`Error escribiendo en log ${filePath}:`, error);
    }
};

// Logger personalizado
const logger = {
    // Log general
    log: (message) => {
        console.log(message);
        writeToLogFile(GENERAL_LOG_FILE, message);
    },
    
    // Log de errores
    error: (message) => {
        console.error(message);
        writeToLogFile(ERROR_LOG_FILE, message);
    },
    
    // Log específico para actualizaciones de stock
    stockUpdate: (message) => {
        console.error(message); // Usamos console.error para asegurar que salga en la consola
        writeToLogFile(STOCK_LOG_FILE, message);
    },
    
    // Sobrecarga del console.log original para guardar todo en los logs
    overrideConsole: () => {
        const originalConsoleLog = console.log;
        const originalConsoleError = console.error;
        
        console.log = function() {
            const args = Array.from(arguments);
            originalConsoleLog.apply(console, args);
            writeToLogFile(GENERAL_LOG_FILE, args.join(' '));
        };
        
        console.error = function() {
            const args = Array.from(arguments);
            originalConsoleError.apply(console, args);
            writeToLogFile(ERROR_LOG_FILE, args.join(' '));
            
            // Si el mensaje contiene "stock", también lo guardamos en el log de stock
            const message = args.join(' ').toLowerCase();
            if (message.includes('stock') || message.includes('unranked')) {
                writeToLogFile(STOCK_LOG_FILE, args.join(' '));
            }
        };
        
        logger.log('Console logger override activado - Todos los logs se guardarán en archivos');
    }
};

module.exports = logger;
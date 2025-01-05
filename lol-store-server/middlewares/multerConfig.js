const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ruta de la carpeta donde se guardarán los recibos
const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');


// Asegúrate de que la carpeta existe
if (!fs.existsSync(receiptsDir)) {
    fs.mkdirSync(receiptsDir, { recursive: true }); // Crear la carpeta de forma recursiva
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, receiptsDir); // Usar la carpeta creada
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Renombrar el archivo con timestamp
    }
});

const upload = multer({ storage });

module.exports = upload;

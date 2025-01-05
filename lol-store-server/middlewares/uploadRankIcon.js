const multer = require('multer');
const path = require('path');
const fs = require('fs');


// Configuración de almacenamiento de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../public/RankIcons');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const fileExtension = path.extname(file.originalname);
        const fileName = `${file.fieldname}-${Date.now()}${fileExtension}`;
        cb(null, fileName);
    }
});

// Middleware de multer para un solo archivo
const upload = multer({ storage });

module.exports = upload;

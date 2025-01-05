const fs = require('fs');

// Función para leer un archivo JSON o devolver un array vacío si no existe o si está vacío
function loadJsonData(filePath, isArray = false) {
    try {
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, isArray ? '[]' : '{}');
            return isArray ? [] : {};
        }

        const data = fs.readFileSync(filePath, 'utf8');
        if (data.trim() === '') return isArray ? [] : {};
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
    }
    return isArray ? [] : {};
}

// Función para guardar los datos en un archivo JSON
function saveJsonData(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

module.exports = {
    loadJsonData,
    saveJsonData
};

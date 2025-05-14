const mongoose = require('mongoose');
const { dbConfig } = require('../config/config');

// Conectar a MongoDB
function connectToDatabase() {
    mongoose.connect(dbConfig.uri, dbConfig.options)
        .then(() => {
            console.log('Conexión exitosa a la base de datos.');
        })
        .catch((error) => {
            console.error('Error al conectar a la base de datos:', error.message);
            process.exit(1);  // Terminar el proceso si no se puede conectar
        });
}

module.exports = { connectToDatabase };

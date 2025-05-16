/**
 * Script para verificar la conexión a MongoDB
 */

const mongoose = require('mongoose');
const config = require('./config/config');

// Determinar la URL de conexión
const mongoURL = process.env.MONGODB_URI || config.dbConfig.uri || 'mongodb://localhost:27017/kassadin-store';

console.log('=== VERIFICACIÓN DE CONEXIÓN A MONGODB ===');
console.log(`Intentando conectar a: ${mongoURL}`);

// Intentar conectar a MongoDB
mongoose.connect(mongoURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ CONEXIÓN EXITOSA a MongoDB');
    console.log('La base de datos está activa y funcionando correctamente');
    
    // Listar colecciones disponibles
    return mongoose.connection.db.listCollections().toArray();
})
.then(collections => {
    console.log('\n📋 COLECCIONES DISPONIBLES:');
    collections.forEach((collection, index) => {
        console.log(`${index + 1}. ${collection.name}`);
    });
    
    console.log('\n✅ Tu sistema está listo para funcionar con la base de datos');
    console.log('Puedes proceder a iniciar tu servidor normalmente.');
})
.catch(err => {
    console.error('❌ ERROR DE CONEXIÓN a MongoDB:', err.message);
    
    if (err.message.includes('ECONNREFUSED')) {
        console.error('\n⚠️ PROBLEMA DETECTADO: MongoDB no está ejecutándose');
        console.error('Posibles soluciones:');
        console.error('1. Inicia MongoDB en tu máquina local');
        console.error('2. Si usas MongoDB Atlas o un servicio remoto, verifica tu conexión a internet');
        console.error('3. Verifica que la URL de conexión en .env o config.js sea correcta');
    } else if (err.message.includes('Authentication failed')) {
        console.error('\n⚠️ PROBLEMA DETECTADO: Credenciales incorrectas');
        console.error('Verifica tu usuario y contraseña en la URL de conexión');
    } else {
        console.error('\n⚠️ Revisa tu configuración de MongoDB y asegúrate de que el servicio esté activo');
    }
})
.finally(() => {
    // Cerrar la conexión después de 2 segundos
    setTimeout(() => {
        mongoose.connection.close()
            .then(() => console.log('\nConexión cerrada'))
            .catch(err => console.error('Error al cerrar la conexión:', err))
            .finally(() => process.exit(0));
    }, 2000);
});
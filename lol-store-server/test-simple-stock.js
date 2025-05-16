// Script más simple para probar la funcionalidad de stock de unrankeds directamente
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Crear un archivo de log
const logFile = path.join(__dirname, 'stock-test.log');
fs.writeFileSync(logFile, '-- INICIO DEL TEST --\n');

// Función para loguear
function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n');
}

// Paso 1: Cargar el modelo de Unranked directamente
log('Paso 1: Cargando modelo de Unranked...');
const unrankedSchema = new mongoose.Schema({
  titulo: String,
  stock: {
    type: Number,
    default: 1,
    min: 0
  },
  active: {
    type: Boolean,
    default: true
  }
});
const Unranked = mongoose.model('Unranked', unrankedSchema);

// Paso 2: Conectar a la base de datos
log('Paso 2: Conectando a MongoDB...');
const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/kassadin-store';
log(`URL de conexión: ${mongoURL}`);

(async function() {
  try {
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    log('Conexión exitosa a MongoDB');

    // Paso 3: Encontrar una cuenta unranked
    log('Paso 3: Buscando cuentas unranked...');
    const account = await Unranked.findOne({ active: true }).select('_id titulo stock active');
    
    if (!account) {
      log('No se encontró ninguna cuenta unranked activa');
      return;
    }
    
    log(`Cuenta encontrada: ID=${account._id}, Título=${account.titulo}, Stock=${account.stock}, Activa=${account.active}`);
    
    // Paso 4: Simular actualización de stock
    log('Paso 4: Actualizando stock...');
    const quantity = 1;
    const newStock = Math.max(0, account.stock - quantity);
    log(`Nuevo stock calculado: ${account.stock} - ${quantity} = ${newStock}`);
    
    const updateData = { stock: newStock };
    if (newStock <= 0) {
      updateData.active = false;
      log('Stock llegaría a 0, se desactivará la cuenta');
    }
    
    // Realizar la actualización
    const result = await Unranked.findByIdAndUpdate(
      account._id,
      updateData,
      { new: true }
    );
    
    log(`Actualización completada. Nuevo stock: ${result.stock}, Activa: ${result.active}`);
    
    // Paso 5: Restaurar el stock original para futuras pruebas
    log('Paso 5: Restaurando stock original...');
    await Unranked.findByIdAndUpdate(
      account._id,
      { stock: account.stock, active: true }
    );
    log('Stock restaurado exitosamente');
    
  } catch (error) {
    log(`ERROR: ${error.message}`);
    log(error.stack);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    log('Conexión a MongoDB cerrada');
    log('-- FIN DEL TEST --');
  }
})();
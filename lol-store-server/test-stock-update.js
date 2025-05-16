// Script para probar la actualización de stock de unrankeds
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Unranked = require('./database/Models/unrankedModel');

// Cargar variables de entorno
dotenv.config();

// URL de conexión a MongoDB (asegúrate de que coincida con la de tu aplicación)
const mongoURL = process.env.MONGODB_URI || 'mongodb://localhost:27017/kassadin-store';

async function main() {
  try {
    console.log('Conectando a MongoDB...');
    // Conectar a MongoDB
    await mongoose.connect(mongoURL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Conexión exitosa a MongoDB');

    // Listar todas las cuentas unranked para elegir una para pruebas
    console.log('Obteniendo lista de cuentas unranked...');
    const accounts = await Unranked.find({ active: true }).select('_id titulo stock active');
    
    console.log(`Se encontraron ${accounts.length} cuentas unranked activas:`);
    accounts.forEach((account, index) => {
      console.log(`${index + 1}. ID: ${account._id}, Título: ${account.titulo}, Stock: ${account.stock}, Activa: ${account.active}`);
    });

    // Si hay cuentas, elegimos la primera para la prueba
    if (accounts.length > 0) {
      const testAccount = accounts[0];
      console.log(`\nProbando actualización de stock para cuenta: ${testAccount.titulo} (ID: ${testAccount._id})`);
      console.log(`Stock actual: ${testAccount.stock}`);

      // Simulamos una actualización de stock
      const quantity = 1; // Cantidad a decrementar
      const newStock = Math.max(0, testAccount.stock - quantity);
      console.log(`Calculando nuevo stock: ${testAccount.stock} - ${quantity} = ${newStock}`);

      // Preparar datos de actualización
      const updateData = { stock: newStock };
      if (newStock <= 0) {
        updateData.active = false;
        console.log('Stock llegaría a 0, se desactivará la cuenta');
      }

      // Realizar la actualización
      console.log('Actualizando en la base de datos...');
      const result = await Unranked.findByIdAndUpdate(
        testAccount._id,
        updateData,
        { new: true }
      );

      console.log(`Actualización completada. Nuevo stock: ${result.stock}, Activa: ${result.active}`);
      
      // Para facilitar la prueba, volvemos a incrementar el stock para futuras pruebas
      console.log('\nRestaurando stock original para futuras pruebas...');
      await Unranked.findByIdAndUpdate(
        testAccount._id,
        { stock: testAccount.stock, active: true }
      );
      console.log('Stock restaurado exitosamente');
    } else {
      console.log('No se encontraron cuentas unranked activas para probar');
    }

  } catch (error) {
    console.error('Error durante la prueba:', error);
  } finally {
    // Cerrar la conexión
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar la función principal
main().catch(console.error);
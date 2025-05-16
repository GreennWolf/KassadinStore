/**
 * Script para probar el flujo completo de actualización de stock
 * Este script simula una compra de una cuenta unranked y luego cambia su estado a completado
 */

const logger = require('./utils/logger');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Activar el override de console.log para guardar todos los logs
logger.overrideConsole();

// Modelos necesarios
const Unranked = require('./database/Models/unrankedModel');
const Purchase = require('./database/Models/purcharseModel');
const Status = require('./database/Models/statusModel');
const User = require('./database/Models/userModel');

// Cargar variables de entorno
dotenv.config();

// URL de conexión a MongoDB
const mongoURL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/KassadinStore';

// Función principal
async function main() {
    try {
        logger.log('=== INICIANDO PRUEBA DE FLUJO DE STOCK ===');
        
        // Paso 1: Conectar a MongoDB
        logger.log('Paso 1: Conectando a MongoDB...');
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        logger.log('Conexión exitosa a MongoDB');
        
        // Paso 2: Verificar que existan cuentas unranked
        logger.log('Paso 2: Buscando cuentas unranked activas...');
        const unrankedAccounts = await Unranked.find({ active: true, stock: { $gt: 0 } }).limit(1);
        
        if (unrankedAccounts.length === 0) {
            logger.error('No se encontraron cuentas unranked activas con stock. Creando una cuenta de prueba...');
            
            // Crear una cuenta unranked de prueba
            const newAccount = new Unranked({
                titulo: 'Cuenta de Prueba para Stock',
                stock: 5,
                active: true,
                nivel: 30,
                rpAmount: 0,
                escenciaNaranja: 0,
                region: 'LAS',
                priceRP: '64df3ad3ee6d4ca1f5cde0f5', // ID ficticio, ajustar según tu BD
                handUpgrade: true
            });
            
            await newAccount.save();
            logger.log(`Cuenta de prueba creada con ID: ${newAccount._id}`);
            unrankedAccounts.push(newAccount);
        }
        
        const testAccount = unrankedAccounts[0];
        logger.log(`Usando cuenta para pruebas: ID=${testAccount._id}, Título=${testAccount.titulo}, Stock=${testAccount.stock}`);
        
        // Paso 3: Buscar un usuario de prueba o crear uno
        logger.log('Paso 3: Buscando usuario para pruebas...');
        let testUser = await User.findOne({}).limit(1);
        
        if (!testUser) {
            logger.error('No se encontraron usuarios. Creando usuario de prueba...');
            testUser = new User({
                username: 'test_user',
                email: 'test@example.com',
                password: 'password123',
                role: 'user'
            });
            await testUser.save();
            logger.log(`Usuario de prueba creado con ID: ${testUser._id}`);
        }
        
        logger.log(`Usando usuario para pruebas: ID=${testUser._id}`);
        
        // Paso 4: Buscar estados para la compra
        logger.log('Paso 4: Buscando estados para la compra...');
        const defaultStatus = await Status.findOne({ default: true });
        const completedStatus = await Status.findOne({ 
            status: { $in: ['Completado', 'Finalizado', 'Procesado'] } 
        });
        
        if (!defaultStatus || !completedStatus) {
            logger.error('No se encontraron los estados necesarios. Finalizando prueba.');
            await mongoose.connection.close();
            return;
        }
        
        logger.log(`Estado inicial: ${defaultStatus.status} (${defaultStatus._id})`);
        logger.log(`Estado completado: ${completedStatus.status} (${completedStatus._id})`);
        
        // Paso 5: Crear una compra de prueba
        logger.log('Paso 5: Creando compra de prueba...');
        const testPurchase = new Purchase({
            userId: testUser._id,
            items: [{
                itemId: testAccount._id,
                itemType: 'Unranked',
                quantity: 1,
                isUnranked: true
            }],
            paymentMethodId: '64df3c10ee6d4ca1f5cde116', // ID ficticio, ajustar según tu BD
            receipt: 'test-receipt.jpg',
            riotName: 'TestUser#123',
            discordName: 'TestUser#1234',
            region: 'LAS',
            Total: 1000,
            currencyId: '64df3c10ee6d4ca1f5cde120', // ID ficticio, ajustar según tu BD
            status: {
                statusId: defaultStatus._id,
                estadoConfirmado: false,
                confirmadoEn: null
            }
        });
        
        await testPurchase.save();
        logger.log(`Compra de prueba creada con ID: ${testPurchase._id}`);
        
        // Paso 6: Registrar el stock actual
        logger.log('Paso 6: Verificando stock actual...');
        const currentStock = testAccount.stock;
        logger.log(`Stock actual de la cuenta ${testAccount._id}: ${currentStock}`);
        
        // Paso 7: Actualizar el estado de la compra a completado
        logger.log('Paso 7: Actualizando estado de la compra a completado...');
        logger.stockUpdate(`PRUEBA: Cambiando estado de compra ${testPurchase._id} a "${completedStatus.status}" para activar proceso de stock`);
        
        const updatedPurchase = await Purchase.findByIdAndUpdate(
            testPurchase._id,
            {
                status: {
                    statusId: completedStatus._id,
                    estadoConfirmado: false,
                    confirmadoEn: null
                },
                statusChangedAt: new Date(),
                statusChangeViewed: false
            },
            { new: true }
        );
        
        logger.log(`Estado de la compra actualizado: ${updatedPurchase.status.statusId}`);
        
        // Paso 8: Verificar si el stock se actualizó
        logger.log('Paso 8: Esperando 2 segundos y verificando si el stock se actualizó...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos
        
        const updatedAccount = await Unranked.findById(testAccount._id);
        logger.log(`Stock actualizado de la cuenta ${testAccount._id}: ${updatedAccount.stock} (era ${currentStock})`);
        
        if (updatedAccount.stock === currentStock - 1) {
            logger.log('ÉXITO: El stock se decrementó correctamente');
        } else if (updatedAccount.stock === currentStock) {
            logger.error('FALLO: El stock NO se decrementó');
        } else {
            logger.log(`RESULTADO INESPERADO: El stock cambió de ${currentStock} a ${updatedAccount.stock}`);
        }
        
        // Paso 9: Eliminar los datos de prueba
        logger.log('Paso 9: Limpiando datos de prueba...');
        
        // Restaurar el stock original
        await Unranked.findByIdAndUpdate(testAccount._id, { stock: currentStock });
        
        // Eliminar la compra de prueba
        await Purchase.findByIdAndDelete(testPurchase._id);
        
        logger.log('Datos de prueba limpiados correctamente');
        logger.log('=== PRUEBA DE FLUJO DE STOCK FINALIZADA ===');
        
    } catch (error) {
        logger.error('Error durante la prueba:', error);
    } finally {
        await mongoose.connection.close();
        logger.log('Conexión a MongoDB cerrada');
    }
}

// Ejecutar la prueba
main().catch(error => {
    logger.error('Error inesperado:', error);
});
// migrationScript.js
// Ejecutar este script una sola vez para corregir todos los inventarios

const mongoose = require('mongoose');
const path = require('path');

// Importar la configuración de la base de datos
const config = require('../config/config'); // Ajusta esta ruta si es necesario

// Obtener la URI de MongoDB desde la configuración
const MONGO_URI = config.dbConfig.uri;

// Importar modelos
const Inventory = require('../database/Models/inventoryModel');
const Item = require('../database/Models/itemsModel');
const Skin = require('../database/Models/skinModel');
const { v4: uuidv4 } = require('uuid');

console.log('Iniciando conexión a MongoDB...');
console.log(`URI: ${MONGO_URI}`);

// Conectar a la base de datos
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Conexión a MongoDB establecida');
    migrateInventoryItems();
  })
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });

async function migrateInventoryItems() {
  console.log('Iniciando migración de items en inventarios...');
  
  try {
    // 1. Obtener todos los inventarios
    const inventories = await Inventory.find({}).populate({
      path: 'activeItems.itemId',
      refPath: 'activeItems.itemType'
    });
    
    console.log(`Encontrados ${inventories.length} inventarios para procesar`);
    
    let totalItemsUpdated = 0;
    let totalUsersUpdated = 0;
    
    // 2. Procesar cada inventario
    for (const inventory of inventories) {
      let userItemsUpdated = 0;
      let inventoryModified = false;
      const userId = inventory.userId;
      
      console.log(`Procesando inventario de usuario ${userId}...`);
      
      // 3. Verificar cada item activo que necesite actualización
      for (let i = 0; i < inventory.activeItems.length; i++) {
        const item = inventory.activeItems[i];
        
        // Verificar si el item necesita actualización (sin detalles o detalles incompletos)
        if (!item.details || !item.details.name) {
          console.log(`Encontrado item ${item._id} de tipo ${item.itemType} sin detalles completos`);
          
          try {
            // Buscar los datos completos según el tipo de item
            if (item.itemType === 'Skin') {
              // Buscar la skin completa en la base de datos
              const skinData = await Skin.findById(item.itemId).populate('champion');
              
              if (skinData) {
                // Crear nuevos detalles
                const details = {
                  name: skinData.NombreSkin || skinData.name || "Skin",
                  obtainedFrom: item.obtainedFrom || "purchase",
                  fullInfo: true,
                  src: skinData.src || "",
                  srcLocal: skinData.srcLocal || ""
                };
                
                if (skinData.champion) {
                  details.champion = skinData.champion._id;
                }
                
                // Actualizar los detalles del item
                inventory.activeItems[i].details = details;
                inventoryModified = true;
                userItemsUpdated++;
                console.log(`Actualizada Skin: ${details.name}`);
              } else {
                console.log(`¡Advertencia! No se encontró la Skin con ID ${item.itemId}`);
              }
            } else if (item.itemType === 'Item') {
              // Buscar el item completo en la base de datos
              const itemData = await Item.findById(item.itemId);
              
              if (itemData) {
                // Crear nuevos detalles
                const details = {
                  name: itemData.name || "Item",
                  obtainedFrom: item.obtainedFrom || "purchase",
                  fullInfo: true,
                  src: itemData.srcWeb || "",
                  srcLocal: itemData.srcLocal || ""
                };
                
                // Actualizar los detalles del item
                inventory.activeItems[i].details = details;
                inventoryModified = true;
                userItemsUpdated++;
                console.log(`Actualizado Item: ${details.name}`);
              } else {
                console.log(`¡Advertencia! No se encontró el Item con ID ${item.itemId}`);
              }
            }
            // Se podría agregar más casos para otros tipos de items si es necesario
          } catch (error) {
            console.error(`Error procesando item ${item._id}:`, error);
          }
        }
      }
      
      // 4. Repetir el mismo proceso para los items usados
      for (let i = 0; i < inventory.usedItems.length; i++) {
        const item = inventory.usedItems[i];
        
        if (!item.details || !item.details.name) {
          console.log(`Encontrado item usado ${item._id} de tipo ${item.itemType} sin detalles completos`);
          
          try {
            if (item.itemType === 'Skin') {
              const skinData = await Skin.findById(item.itemId).populate('champion');
              
              if (skinData) {
                const details = {
                  name: skinData.NombreSkin || skinData.name || "Skin",
                  obtainedFrom: item.obtainedFrom || "purchase",
                  fullInfo: true,
                  src: skinData.src || "",
                  srcLocal: skinData.srcLocal || ""
                };
                
                if (skinData.champion) {
                  details.champion = skinData.champion._id;
                }
                
                inventory.usedItems[i].details = details;
                inventoryModified = true;
                userItemsUpdated++;
                console.log(`Actualizada Skin usada: ${details.name}`);
              } else {
                console.log(`¡Advertencia! No se encontró la Skin usada con ID ${item.itemId}`);
              }
            } else if (item.itemType === 'Item') {
              const itemData = await Item.findById(item.itemId);
              
              if (itemData) {
                const details = {
                  name: itemData.name || "Item",
                  obtainedFrom: item.obtainedFrom || "purchase",
                  fullInfo: true,
                  src: itemData.srcWeb || "",
                  srcLocal: itemData.srcLocal || ""
                };
                
                inventory.usedItems[i].details = details;
                inventoryModified = true;
                userItemsUpdated++;
                console.log(`Actualizado Item usado: ${details.name}`);
              } else {
                console.log(`¡Advertencia! No se encontró el Item usado con ID ${item.itemId}`);
              }
            }
          } catch (error) {
            console.error(`Error procesando item usado ${item._id}:`, error);
          }
        }
      }
      
      // 5. Guardar el inventario si se modificó
      if (inventoryModified) {
        inventory.lastUpdated = new Date();
        await inventory.save();
        totalUsersUpdated++;
        totalItemsUpdated += userItemsUpdated;
        console.log(`Actualizado inventario de usuario ${userId} con ${userItemsUpdated} items`);
      } else {
        console.log(`No se requirieron cambios para usuario ${userId}`);
      }
    }
    
    console.log('=== RESUMEN DE MIGRACIÓN ===');
    console.log(`Total de usuarios afectados: ${totalUsersUpdated}`);
    console.log(`Total de items actualizados: ${totalItemsUpdated}`);
    console.log('Migración completada exitosamente');
    
  } catch (error) {
    console.error('Error durante el proceso de migración:', error);
  } finally {
    mongoose.disconnect();
    console.log('Desconexión de MongoDB');
  }
}
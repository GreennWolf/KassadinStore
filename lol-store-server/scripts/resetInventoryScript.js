// resetInventoryScript.js
// Este script "reinicia" los inventarios eliminando y volviendo a crear todos los items

const mongoose = require('mongoose');
const Inventory = require('../database/Models/inventoryModel');
const User = require('../database/Models/userModel');
const Item = require('../database/Models/itemsModel');
const Skin = require('../database/Models/skinModel');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

// Conectar a la base de datos
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Conexión a MongoDB establecida'))
  .catch(err => {
    console.error('Error conectando a MongoDB:', err);
    process.exit(1);
  });

async function resetInventories() {
  console.log('Iniciando reinicio de inventarios...');
  
  try {
    // 1. Obtener todos los inventarios
    const inventories = await Inventory.find({});
    
    console.log(`Encontrados ${inventories.length} inventarios para reiniciar`);
    
    // 2. Procesar cada inventario
    for (const inventory of inventories) {
      const userId = inventory.userId;
      console.log(`Reiniciando inventario de usuario ${userId}...`);
      
      // Crear copia de items activos antes de reiniciar
      const activeItemsBackup = [...inventory.activeItems];
      const usedItemsBackup = [...inventory.usedItems];
      
      // Almacenar el número de items antes del reinicio
      const numActiveItems = activeItemsBackup.length;
      const numUsedItems = usedItemsBackup.length;
      
      // 3. Vaciar los arrays de items
      inventory.activeItems = [];
      inventory.usedItems = [];
      
      // 4. Procesar items activos y volver a agregarlos con detalles completos
      for (const item of activeItemsBackup) {
        try {
          if (item.itemType === 'Skin') {
            // Buscar la skin en la base de datos
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
              
              // Crear nuevo item con todos los detalles
              inventory.activeItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                quantity: item.quantity || 1,
                obtainedFrom: item.obtainedFrom,
                obtainedAt: item.obtainedAt || new Date(),
                goldSpent: item.goldSpent || 0,
                claimed: item.claimed || false,
                entryId: item.entryId || uuidv4(),
                details: details
              });
              
              console.log(`Reañadida Skin: ${details.name}`);
            } else {
              console.log(`¡Advertencia! No se encontró la Skin con ID ${item.itemId}`);
            }
          } else if (item.itemType === 'Item') {
            // Buscar el item en la base de datos
            const itemData = await Item.findById(item.itemId);
            
            if (itemData) {
              const details = {
                name: itemData.name || "Item",
                obtainedFrom: item.obtainedFrom || "purchase",
                fullInfo: true,
                src: itemData.srcWeb || "",
                srcLocal: itemData.srcLocal || ""
              };
              
              inventory.activeItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                quantity: item.quantity || 1,
                obtainedFrom: item.obtainedFrom,
                obtainedAt: item.obtainedAt || new Date(),
                goldSpent: item.goldSpent || 0,
                claimed: item.claimed || false,
                entryId: item.entryId || uuidv4(),
                details: details
              });
              
              console.log(`Reañadido Item: ${details.name}`);
            } else {
              console.log(`¡Advertencia! No se encontró el Item con ID ${item.itemId}`);
            }
          } else {
            // Para otros tipos (cupones, fragmentos), mantener los datos originales
            inventory.activeItems.push({
              ...item,
              entryId: item.entryId || uuidv4()
            });
            console.log(`Reañadido otro tipo (${item.itemType})`);
          }
        } catch (error) {
          console.error(`Error procesando item activo:`, error);
        }
      }
      
      // 5. Procesar items usados y volver a agregarlos con detalles completos
      for (const item of usedItemsBackup) {
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
              
              inventory.usedItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                quantity: item.quantity || 1,
                obtainedFrom: item.obtainedFrom,
                obtainedAt: item.obtainedAt,
                usedAt: item.usedAt || new Date(),
                goldSpent: item.goldSpent || 0,
                details: details
              });
              
              console.log(`Reañadida Skin usada: ${details.name}`);
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
              
              inventory.usedItems.push({
                itemType: item.itemType,
                itemId: item.itemId,
                quantity: item.quantity || 1,
                obtainedFrom: item.obtainedFrom,
                obtainedAt: item.obtainedAt,
                usedAt: item.usedAt || new Date(),
                goldSpent: item.goldSpent || 0,
                details: details
              });
              
              console.log(`Reañadido Item usado: ${details.name}`);
            } else {
              console.log(`¡Advertencia! No se encontró el Item usado con ID ${item.itemId}`);
            }
          } else {
            // Para otros tipos, mantener los datos originales
            inventory.usedItems.push(item);
            console.log(`Reañadido otro tipo usado (${item.itemType})`);
          }
        } catch (error) {
          console.error(`Error procesando item usado:`, error);
        }
      }
      
      // 6. Guardar el inventario
      inventory.lastUpdated = new Date();
      await inventory.save();
      
      console.log(`Reiniciado inventario de usuario ${userId}`);
      console.log(`Items activos: ${numActiveItems} → ${inventory.activeItems.length}`);
      console.log(`Items usados: ${numUsedItems} → ${inventory.usedItems.length}`);
    }
    
    console.log('=== RESUMEN DE REINICIO ===');
    console.log(`Total de inventarios procesados: ${inventories.length}`);
    console.log('Reinicio completado exitosamente');
    
  } catch (error) {
    console.error('Error durante el proceso de reinicio:', error);
  } finally {
    mongoose.disconnect();
    console.log('Desconexión de MongoDB');
  }
}

// Ejecutar el reinicio
resetInventories();
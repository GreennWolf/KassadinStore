/**
 * Script para actualizar la base de datos con los campeones descargados
 * 
 * Este script actualiza la base de datos MongoDB con los campeones
 * que ya han sido descargados previamente con el script updateChampions.js.
 * 
 * Uso:
 * 1. Primero ejecuta updateChampions.js para descargar todos los iconos
 * 2. Luego ejecuta este script para actualizar la base de datos
 * 
 * Ejecución:
 * node scripts/updateChampionsInDB.js
 */

const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/config');

// Directorio donde están las imágenes
const championDir = path.join(__dirname, '../public/champions');

// Mapeo de nombres especiales (ID interno -> Nombre visual)
const championMappings = {
    'MonkeyKing': 'Wukong',
    'Nunu': 'Nunu & Willump',
    'AurelionSol': 'Aurelion Sol',
    'Belveth': 'Bel\'Veth',
    'Chogath': 'Cho\'Gath',
    'DrMundo': 'Dr. Mundo',
    'JarvanIV': 'Jarvan IV',
    'Kaisa': 'Kai\'Sa',
    'Khazix': 'Kha\'Zix',
    'KogMaw': 'Kog\'Maw',
    'KSante': 'K\'Sante',
    'Leblanc': 'LeBlanc',
    'LeeSin': 'Lee Sin',
    'MasterYi': 'Master Yi',
    'MissFortune': 'Miss Fortune',
    'RekSai': 'Rek\'Sai',
    'Renata': 'Renata Glasc',
    'TahmKench': 'Tahm Kench',
    'TwistedFate': 'Twisted Fate',
    'Velkoz': 'Vel\'Koz',
    'XinZhao': 'Xin Zhao'
};

// Conexión a la base de datos
const connectDB = async () => {
    try {
        await mongoose.connect(config.dbConfig.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error);
        process.exit(1);
    }
};

// Función principal
const updateChampionsInDB = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();
        
        // Cargar el modelo de campeón
        const Champion = require('../database/Models/championModel');
        
        // Obtener lista de archivos en el directorio de campeones
        const files = await fs.readdir(championDir);
        
        // Filtrar solo los archivos PNG
        const pngFiles = files.filter(file => file.toLowerCase().endsWith('.png'));
        
        console.log(`Encontrados ${pngFiles.length} archivos PNG en el directorio de campeones`);
        
        // Procesar cada archivo
        for (const file of pngFiles) {
            // Obtener el nombre del campeón sin la extensión .png
            const championName = file.replace('.png', '');
            
            // Buscar el campeón en la base de datos
            let champion = await Champion.findOne({ name: championName });
            
            if (champion) {
                // Actualizar el campeón existente
                champion.icon = `/champions/${file}`;
                champion.active = true;
                await champion.save();
                console.log(`Campeón actualizado: ${championName}`);
            } else {
                // Crear un nuevo campeón
                champion = new Champion({
                    name: championName,
                    icon: `/champions/${file}`,
                    active: true
                });
                
                // Buscar si hay un ID para este campeón en el mapeo
                const riotId = Object.keys(championMappings).find(key => championMappings[key] === championName);
                if (riotId) {
                    champion.riotId = riotId;
                }
                
                await champion.save();
                console.log(`Nuevo campeón creado: ${championName}`);
            }
        }
        
        // Actualizar también los campeones por su ID interno
        for (const [riotId, visualName] of Object.entries(championMappings)) {
            // Verificar si el archivo existe
            const fileName = `${riotId}.png`;
            const filePath = path.join(championDir, fileName);
            
            try {
                await fs.access(filePath);
                
                // El archivo existe, actualizar o crear el campeón
                let champion = await Champion.findOne({ name: riotId });
                
                if (champion) {
                    // Actualizar el campeón existente
                    champion.icon = `/champions/${fileName}`;
                    champion.riotId = riotId;
                    champion.active = true;
                    await champion.save();
                    console.log(`Campeón interno actualizado: ${riotId}`);
                } else {
                    // Crear un nuevo campeón con el ID interno
                    champion = new Champion({
                        name: riotId,
                        icon: `/champions/${fileName}`,
                        riotId: riotId,
                        active: true,
                        isAlternateVersion: true
                    });
                    
                    await champion.save();
                    console.log(`Nuevo campeón interno creado: ${riotId}`);
                }
            } catch (error) {
                // El archivo no existe, ignorarlo
                console.log(`Archivo ${fileName} no encontrado, ignorando`);
            }
        }
        
        console.log('Actualización de la base de datos completada con éxito');
        
    } catch (error) {
        console.error('Error al actualizar la base de datos:', error);
    } finally {
        // Cerrar la conexión a la base de datos
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('Conexión a MongoDB cerrada');
        }
    }
};

// Ejecutar la actualización
updateChampionsInDB();
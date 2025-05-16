const cron = require('node-cron');
const { 
    scrapeChampionIcons,
    downloadChampionIcons,
    scrapeNewSkins
} = require('../services/scrapeService');
const Champion = require('../database/Models/championModel');
const Skin = require('../database/Models/skinModel');
const mongoose = require('mongoose');
const config = require('../config/config');

// Función para actualizar iconos de campeones
async function updateChampionIcons() {
    try {
        console.log('Iniciando actualización programada de iconos de campeones');
        
        // Conectar a la base de datos si no está conectada
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(config.dbConfig.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Conectado a la base de datos');
        }
        
        // Obtener datos de campeones
        const championsData = await scrapeChampionIcons();
        
        // Descargar iconos
        await downloadChampionIcons(championsData);
        
        // Actualizar la base de datos
        for (const champion of championsData) {
            // Actualizar o crear el campeón
            const updatedChamp = await Champion.findOneAndUpdate(
                { name: champion.name },
                { 
                    name: champion.name,
                    icon: champion.localPath,
                    riotId: champion.id,
                    originalIconPath: `/champions/${champion.originalFileName}`
                },
                { upsert: true, new: true }
            );
            
            // Crear también un registro alternativo para los casos especiales
            if (champion.id !== champion.name && champion.id !== updatedChamp.name) {
                await Champion.findOneAndUpdate(
                    { riotId: champion.id },
                    {
                        name: champion.id,
                        icon: champion.localPath,
                        riotId: champion.id,
                        originalIconPath: `/champions/${champion.originalFileName}`,
                        isAlternateVersion: true
                    },
                    { upsert: true, new: true }
                );
            }
        }
        
        console.log(`Actualización completada: ${championsData.length} campeones actualizados`);
        return championsData.length;
    } catch (error) {
        console.error('Error en la actualización programada de campeones:', error);
        throw error;
    }
}

// Función para actualizar skins nuevas
async function updateNewSkins() {
    try {
        console.log('Iniciando actualización programada de skins nuevas');
        
        // Conectar a la base de datos si no está conectada
        if (mongoose.connection.readyState !== 1) {
            await mongoose.connect(config.dbConfig.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            console.log('Conectado a la base de datos');
        }
        
        // Marcar todas las skins como no nuevas primero
        await Skin.updateMany({}, { new: false });
        console.log('Reseteado estado "new" de todas las skins');
        
        // Obtener las skins nuevas
        const newSkins = await scrapeNewSkins();
        console.log(`Detectadas ${newSkins.length} skins nuevas`);
        
        // Para cada skin nueva, buscarla en la base de datos y marcarla
        let skinsUpdated = 0;
        
        for (const newSkin of newSkins) {
            try {
                // Obtener el campeón
                const champion = await Champion.findOne({
                    $or: [
                        { name: newSkin.champion },
                        { riotId: newSkin.champion }
                    ]
                });
                
                if (!champion) {
                    console.warn(`Campeón no encontrado para skin nueva: ${newSkin.champion}`);
                    continue;
                }
                
                // Buscar la skin por diferentes patrones de nombres
                const possibleNames = [
                    newSkin.fullSkinName,
                    newSkin.skin,
                    `${newSkin.skin} ${newSkin.champion}`,
                    newSkin.skin.replace(`${newSkin.champion} `, '')
                ].filter(Boolean);
                
                const skinQuery = {
                    champion: champion._id,
                    $or: possibleNames.map(name => ({ NombreSkin: { $regex: name, $options: 'i' } }))
                };
                
                const skin = await Skin.findOne(skinQuery);
                
                if (skin) {
                    skin.new = true;
                    await skin.save();
                    skinsUpdated++;
                    console.log(`Skin marcada como nueva: ${skin.NombreSkin}`);
                } else {
                    console.warn(`Skin no encontrada en base de datos: ${newSkin.fullSkinName || newSkin.skin}`);
                }
            } catch (error) {
                console.error(`Error procesando skin nueva: ${error.message}`);
            }
        }
        
        console.log(`Actualización de skins nuevas completada: ${skinsUpdated} de ${newSkins.length} skins actualizadas`);
        return { detected: newSkins.length, updated: skinsUpdated };
    } catch (error) {
        console.error('Error en la actualización de skins nuevas:', error);
        throw error;
    }
}

// Programar las tareas para ejecutarse periódicamente

// Actualizar iconos de campeones: cada semana (domingos a las 3 AM)
// Formato cron: segundo minuto hora día-del-mes mes día-de-la-semana
cron.schedule('0 0 3 * * 0', async () => {
    console.log('Ejecutando actualización programada de campeones');
    await updateChampionIcons();
});

// Actualizar skins nuevas: todos los días a la 1 AM
cron.schedule('0 0 1 * * *', async () => {
    console.log('Ejecutando actualización programada de skins nuevas');
    await updateNewSkins();
});

// También permitir la ejecución manual
if (process.argv.includes('--update-champions')) {
    console.log('Ejecutando actualización de campeones ahora mismo');
    updateChampionIcons().then((count) => {
        console.log(`Actualización manual de campeones completada: ${count} campeones actualizados`);
        process.exit(0);
    }).catch(error => {
        console.error('Error en actualización manual de campeones:', error);
        process.exit(1);
    });
}

if (process.argv.includes('--update-new-skins')) {
    console.log('Ejecutando actualización de skins nuevas ahora mismo');
    updateNewSkins().then((result) => {
        console.log(`Actualización manual de skins nuevas completada: ${result.updated} de ${result.detected} skins actualizadas`);
        process.exit(0);
    }).catch(error => {
        console.error('Error en actualización manual de skins nuevas:', error);
        process.exit(1);
    });
}

// Si no se especifica ningún argumento, ejecutar ambas tareas
if (process.argv.includes('--run-now')) {
    Promise.all([
        updateChampionIcons(),
        updateNewSkins()
    ]).then(() => {
        console.log('Actualización manual completada');
        process.exit(0);
    }).catch(error => {
        console.error('Error en actualización manual:', error);
        process.exit(1);
    });
}

module.exports = { updateChampionIcons, updateNewSkins };
const { 
    scrapeChampionNames, 
    scrapeSkinsForChampion, 
    scrapeChromasForChampion, 
    scrapeNewSkins,
    scrapeChampionIcons,
    downloadChampionIcons
} = require('../services/scrapeService');
const { 
    downloadChampionSkins, 
    downloadChampionChromas 
} = require('../services/imageDownloadService');
const Item = require('../database/Models/itemsModel');
const Champion = require('../database/Models/championModel');
const RPPrice = require('../database/Models/rpPrice');
const Skin = require('../database/Models/skinModel');
const { CustomError } = require('../middlewares/errorHandler');
const progressService = require('../services/progressService');
const websocketService = require('../services/websocketService');

async function handleSkinCreation(skinData, champion) {
    const rpValue = parseInt(skinData.Precio, 10);
    if (isNaN(rpValue)) return null;

    let rpPrice = await RPPrice.findOneAndUpdate(
        { valueRP: rpValue },
        { valueRP: rpValue },
        { upsert: true, new: true }
    );

    const existingSkin = await Skin.findOne({ 
        NombreSkin: skinData.NombreSkin, 
        champion: champion._id 
    });

    if (!existingSkin) {
        return await Skin.create({
            NombreSkin: skinData.NombreSkin,
            src: skinData.src,
            srcLocal: skinData.srcLocal || '',
            champion: champion._id,
            priceRP: rpPrice._id,
            new: false
        });
    }
    return existingSkin;
}

async function handleChromaCreation(chromaData, champion) {
    const skinBase = await Skin.findOne({ 
        NombreSkin: chromaData.NombrePack, 
        champion: champion._id 
    });

    if (!skinBase) {
        console.warn(`Skin base no encontrada para el chroma: ${chromaData.NombrePack}`);
        return null;
    }

    let rpPrice = await RPPrice.findOneAndUpdate(
        { valueRP: chromaData.Precio },
        { valueRP: chromaData.Precio },
        { upsert: true, new: true }
    );

    const existingChroma = await Item.findOne({ 
        name: chromaData.NombreChroma, 
        type: 'chromas', 
        skin: skinBase._id 
    });

    if (!existingChroma) {
        const chroma = await Item.create({
            name: chromaData.NombreChroma,
            type: 'chromas',
            priceRP: rpPrice._id,
            srcWeb: chromaData.src,
            srcLocal: chromaData.srcLocal || '',
            skin: skinBase._id.toString()
        });
        chromaData.id = chroma._id.toString();
        return chroma;
    }

    chromaData.id = existingChroma._id.toString();
    return existingChroma;
}

async function scrapeAndUpdate(req, res, next) {
    // Crear un nuevo trabajo de progreso
    const jobId = progressService.createJob('Scraping de campeones y skins', 100);
    progressService.startJob(jobId);
    
    // Devolver inmediatamente el ID del trabajo
    res.json({ 
        success: true, 
        message: 'Scraping iniciado', 
        jobId 
    });
    
    try {
        // Calcular el número total de pasos
        // 1. Obtener iconos de campeones
        // 2. Procesar cada campeón (incluyendo skins y chromas)
        // 3. Procesar skins nuevas
        
        // Paso 1: Obtener iconos de campeones (10% del progreso total)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 1, 'Actualizando iconos de campeones desde Data Dragon...'
        ));
        
        const championsData = await scrapeChampionIcons();
        await downloadChampionIcons(championsData);
        
        // Actualizar la base de datos con los iconos descargados (5% adicional)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 5, 'Actualizando la base de datos con los iconos descargados...'
        ));
        
        for (const champion of championsData) {
            // Actualizar o crear el campeón
            const updatedChamp = await Champion.findOneAndUpdate(
                { name: champion.name },
                { 
                    name: champion.name,
                    icon: champion.localPath,
                    riotId: champion.id,
                    originalIconPath: `/champions/${champion.originalFileName}`,
                    active: true
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
                        isAlternateVersion: true,
                        active: true
                    },
                    { upsert: true, new: true }
                );
            }
        }
        
        // Paso 2: Obtener lista de campeones (5% adicional)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 10, 'Obteniendo lista de campeones...'
        ));
        
        const champions = await scrapeChampionNames();
        if (!champions?.length) {
            throw new CustomError('No se pudieron obtener los campeones', 500);
        }
        
        // Calcular cuánto progreso asignar por campeón (80% del total para todos los campeones)
        const progressPerChampion = 80 / champions.length;
        let currentProgress = 10; // Comenzamos en 10% después de los iconos
        
        // Procesar cada campeón, sus skins y chromas
        for (let i = 0; i < champions.length; i++) {
            const championName = champions[i];
            const progressStep = Math.floor(currentProgress);
            
            websocketService.emitJobProgress(jobId, progressService.updateProgress(
                jobId, progressStep, `Procesando campeón (${i+1}/${champions.length}): ${championName}`
            ));

            const champion = await Champion.findOneAndUpdate(
                { name: championName },
                { name: championName, active: true },
                { upsert: true, new: true }
            );

            // Obtener skins para este campeón
            const skins = await scrapeSkinsForChampion(championName);
            for (const skinData of skins) {
                await handleSkinCreation(skinData, champion);
            }
            await downloadChampionSkins(championName, skins);

            // Obtener chromas para este campeón
            const chromas = await scrapeChromasForChampion(championName);
            for (const chromaData of chromas) {
                await handleChromaCreation(chromaData, champion);
            }
            await downloadChampionChromas(championName, chromas);
            
            // Actualizar progreso
            currentProgress += progressPerChampion;
        }
        
        // Paso 3: Procesar skins nuevas (10% final)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 90, 'Procesando skins nuevas...'
        ));
        
        // Marcar todas las skins como no nuevas primero
        await Skin.updateMany({}, { new: false });
        
        // Obtener las skins nuevas desde el scraper
        const newSkins = await scrapeNewSkins();
        
        // Para cada skin nueva, intentamos encontrarla en nuestra base de datos y marcarla como nueva
        let processedSkins = 0;
        for (const newSkin of newSkins) {
            try {
                // Obtener primero el campeón por su nombre
                const champion = await Champion.findOne({
                    $or: [
                        { name: newSkin.champion },
                        { riotId: newSkin.champion }
                    ]
                });
                
                if (!champion) {
                    continue;
                }
                
                // Buscar la skin por diferentes patrones de nombres
                const possibleNames = [
                    newSkin.fullSkinName,
                    newSkin.skin,
                    `${newSkin.skin} ${newSkin.champion}`,
                    newSkin.skin.replace(`${newSkin.champion} `, '')
                ].filter(Boolean); // Filtrar valores que sean null o undefined
                
                // Construir la consulta para buscar por posibles nombres
                const skinQuery = {
                    champion: champion._id,
                    $or: possibleNames.map(name => ({ NombreSkin: { $regex: name, $options: 'i' } }))
                };
                
                const skin = await Skin.findOne(skinQuery);
                
                if (skin) {
                    skin.new = true;
                    await skin.save();
                    processedSkins++;
                    
                    // Actualizar progreso para skins nuevas
                    if (newSkins.length > 0) {
                        const skinProgress = 90 + ((processedSkins / newSkins.length) * 9);
                        websocketService.emitJobProgress(jobId, progressService.updateProgress(
                            jobId, Math.floor(skinProgress), 
                            `Procesando skin nueva (${processedSkins}/${newSkins.length}): ${skin.NombreSkin}`
                        ));
                    }
                }
            } catch (error) {
                console.error(`Error procesando skin nueva: ${error.message}`);
            }
        }
        
        // Contar cuántas skins fueron marcadas como nuevas
        const newSkinsCount = await Skin.countDocuments({ new: true });
        
        // Completar el trabajo
        const result = { 
            message: 'Scraping completado exitosamente', 
            championsProcessed: championsData.length,
            skinsProcessed: champions.length,
            newSkinsDetected: newSkins.length,
            newSkinsMarked: newSkinsCount
        };
        
        progressService.completeJob(jobId, result);
        websocketService.emitJobCompleted(jobId, result);
        
    } catch (error) {
        console.error('Error durante el scraping:', error);
        
        // Marcar el trabajo como fallido
        progressService.failJob(jobId, error);
        websocketService.emitJobFailed(jobId, error);
    }
}

// Función para descargar los iconos de los campeones
async function scrapeChampionIconsAndUpdate(req, res, next) {
    // Crear un nuevo trabajo de progreso
    const jobId = progressService.createJob('Actualización de iconos de campeones', 10);
    progressService.startJob(jobId);
    
    // Devolver inmediatamente el ID del trabajo
    res.json({ 
        success: true, 
        message: 'Actualización de iconos iniciada', 
        jobId 
    });
    
    try {
        // Paso 1: Obtener datos de los campeones (30% del progreso)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 3, 'Obteniendo datos de iconos de campeones...'
        ));
        
        const championsData = await scrapeChampionIcons();
        
        // Paso 2: Descargar los iconos (30% del progreso)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 6, 'Descargando iconos de campeones...'
        ));
        
        await downloadChampionIcons(championsData);
        
        // Paso 3: Actualizar la base de datos (40% del progreso)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 9, 'Actualizando base de datos con los iconos...'
        ));
        
        // Actualizar la base de datos con los iconos de los campeones
        for (const champion of championsData) {
            // Actualizar o crear el campeón
            const updatedChamp = await Champion.findOneAndUpdate(
                { name: champion.name },
                { 
                    name: champion.name,
                    icon: champion.localPath,
                    // Guardar también el ID oficial para referencia
                    riotId: champion.id,
                    // Guardar camino al archivo con nombre original también para compatibilidad
                    originalIconPath: `/champions/${champion.originalFileName}`
                },
                { upsert: true, new: true }
            );
            
            // Crear también un registro alternativo para los casos especiales usando el ID interno
            // Esto es útil para campeones como Wukong (MonkeyKing)
            if (champion.id !== champion.name && champion.id !== updatedChamp.name) {
                await Champion.findOneAndUpdate(
                    { riotId: champion.id },
                    {
                        name: champion.id, // Nombre interno como nombre alternativo
                        icon: champion.localPath,
                        riotId: champion.id,
                        originalIconPath: `/champions/${champion.originalFileName}`,
                        isAlternateVersion: true // Marcar como versión alternativa
                    },
                    { upsert: true, new: true }
                );
            }
        }
        
        // Completar el trabajo
        const result = { 
            message: 'Iconos de campeones actualizados exitosamente',
            championsUpdated: championsData.length
        };
        
        progressService.completeJob(jobId, result);
        websocketService.emitJobCompleted(jobId, result);
        
    } catch (error) {
        console.error('Error durante la actualización de iconos:', error);
        
        // Marcar el trabajo como fallido
        progressService.failJob(jobId, error);
        websocketService.emitJobFailed(jobId, error);
    }
}

// Función para actualizar solo los iconos de campeones faltantes
async function updateMissingChampionIcons(req, res, next) {
    // Obtener la lista de campeones específicos que queremos actualizar
    const { champions } = req.body;
    
    if (!champions || !Array.isArray(champions) || champions.length === 0) {
        return res.status(400).json({ 
            message: 'Debe proporcionar una lista de campeones para actualizar',
            example: { 
                champions: ['Ambessa', 'Aurora', 'MonkeyKing', 'Wukong'] 
            }
        });
    }
    
    // Crear un nuevo trabajo de progreso
    const jobId = progressService.createJob('Actualización de iconos específicos', champions.length + 2);
    progressService.startJob(jobId);
    
    // Devolver inmediatamente el ID del trabajo
    res.json({ 
        success: true, 
        message: 'Actualización de iconos específicos iniciada', 
        jobId 
    });
    
    try {
        console.log(`Actualizando iconos para campeones específicos: ${champions.join(', ')}`);
        
        // Paso 1: Ejecutar el script de actualización (30% del progreso)
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 1, 'Ejecutando script de actualización de campeones...'
        ));
        
        // Ejecutar el script updateChampions para obtener todos los iconos
        const { updateChampions } = require('../scripts/updateChampions');
        await updateChampions();
        
        // Paso 2: Verificar los campeones específicos
        websocketService.emitJobProgress(jobId, progressService.updateProgress(
            jobId, 2, 'Verificando iconos de campeones específicos...'
        ));
        
        // Verificar si los campeones solicitados existen en el directorio
        const fs = require('fs').promises;
        const path = require('path');
        const championDir = path.join(__dirname, '../public/champions');
        
        const results = {};
        
        // Procesar cada campeón individualmente
        for (let i = 0; i < champions.length; i++) {
            const champion = champions[i];
            
            websocketService.emitJobProgress(jobId, progressService.updateProgress(
                jobId, i + 3, `Verificando campeón (${i+1}/${champions.length}): ${champion}`
            ));
            
            const filePath = path.join(championDir, `${champion}.png`);
            try {
                await fs.access(filePath);
                results[champion] = {
                    status: 'success',
                    path: `/champions/${champion}.png`,
                    exists: true
                };
            } catch (error) {
                results[champion] = {
                    status: 'error',
                    message: 'No se pudo encontrar o crear el archivo',
                    exists: false
                };
            }
        }
        
        // Completar el trabajo
        const result = {
            message: 'Actualización de iconos de campeones específicos completada',
            results
        };
        
        progressService.completeJob(jobId, result);
        websocketService.emitJobCompleted(jobId, result);
        
    } catch (error) {
        console.error('Error durante la actualización de iconos específicos:', error);
        
        // Marcar el trabajo como fallido
        progressService.failJob(jobId, error);
        websocketService.emitJobFailed(jobId, error);
    }
}

// Obtener skins marcadas como nuevas
async function getNewSkins(req, res, next) {
    try {
        const newSkins = await Skin.find({ new: true })
            .populate('champion', 'name icon')
            .populate('priceRP', 'valueRP');

        res.json({
            success: true,
            count: newSkins.length,
            data: newSkins
        });
    } catch (error) {
        next(error);
    }
}

// Marcar o desmarcar manualmente una skin como nueva
async function toggleSkinNewStatus(req, res, next) {
    try {
        const { skinId } = req.params;
        const { isNew } = req.body;
        
        if (typeof isNew !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'El parámetro isNew debe ser un valor booleano'
            });
        }
        
        const skin = await Skin.findById(skinId);
        if (!skin) {
            return res.status(404).json({
                success: false,
                message: 'Skin no encontrada'
            });
        }
        
        skin.new = isNew;
        await skin.save();
        
        res.json({
            success: true,
            message: `Skin ${isNew ? 'marcada como nueva' : 'desmarcada como nueva'} exitosamente`,
            data: skin
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    scrapeAndUpdate,
    scrapeChampionIconsAndUpdate,
    updateMissingChampionIcons,
    getNewSkins,
    toggleSkinNewStatus
};
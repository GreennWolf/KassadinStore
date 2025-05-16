const EloBoostConfig = require('../database/Models/eloBoostConfigModel');
const Champion = require('../database/Models/championModel');
const { CustomError } = require('../middlewares/errorHandler');

// Obtener la configuración actual
async function getEloBoostConfig(req, res, next) {
    try {
        const config = await EloBoostConfig.getConfig();
        res.status(200).json(config);
    } catch (error) {
        next(error);
    }
}

// Actualizar la configuración
async function updateEloBoostConfig(req, res, next) {
    try {
        const { 
            specificRolePricePercent, 
            specificChampionPricePercent, 
            duoQueuePricePercent,
            availableRoles
        } = req.body;

        // Obtener la configuración actual
        let config = await EloBoostConfig.getConfig();

        // Actualizar los campos proporcionados
        if (specificRolePricePercent !== undefined) {
            config.specificRolePricePercent = specificRolePricePercent;
        }

        if (specificChampionPricePercent !== undefined) {
            config.specificChampionPricePercent = specificChampionPricePercent;
        }

        if (duoQueuePricePercent !== undefined) {
            config.duoQueuePricePercent = duoQueuePricePercent;
        }

        if (availableRoles) {
            config.availableRoles = Array.isArray(availableRoles) ? availableRoles : JSON.parse(availableRoles);
        }

        // Guardar cambios
        await config.save();

        res.status(200).json(config);
    } catch (error) {
        next(error);
    }
}

// Obtener campeones disponibles para EloBoost
async function getAvailableChampions(req, res, next) {
    try {
        // Obtener todos los campeones ordenados por nombre
        const champions = await Champion.find()
            .select('name icon')
            .sort({ name: 1 });
        
        // Procesar los campeones para incluir la URL completa de las imágenes
        const processedChampions = champions.map(champion => {
            const championObj = champion.toObject();
            
            // Asegurarnos de que todos los campeones tengan una URL de icono
            // Si no tienen icono explícito, usar la URL basada en el nombre para evitar problemas
            const API_URL = process.env.API_URL || 'http://localhost:3000';
            
            if (championObj.icon) {
                championObj.icon = `${API_URL}${championObj.icon}`;
            } else {
                // Crear una URL basada en el nombre del campeón
                championObj.icon = `${API_URL}/champions/${championObj.name}.png`;
            }
            
            return championObj;
        });
        
        res.status(200).json(processedChampions);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getEloBoostConfig,
    updateEloBoostConfig,
    getAvailableChampions
};
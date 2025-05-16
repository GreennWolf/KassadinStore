const EloBoostRank = require('../database/Models/eloBoostRankModel');
const EloBoostConfig = require('../database/Models/eloBoostConfigModel');
const RPPrice = require('../database/Models/rpPrice');
const RPPriceConversion = require('../database/Models/RPPriceConversion');
const { CustomError } = require('../middlewares/errorHandler');
const fs = require('fs');
const path = require('path');

// Helper function para asegurar que existe el directorio de iconos
function ensureIconDirectoryExists() {
    const uploadDir = path.join(__dirname, '../public/RankIcons');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}

// Función para obtener todos los rangos ordenados
async function getAllEloBoostRanks(req, res, next) {
    try {
        const ranks = await EloBoostRank.find()
            .populate('rankUpPriceRP')
            .populate('divisionPriceRP')
            .sort({ order: 1 }); // Ordenados por nivel (hierro, bronce, plata, etc.)
        
        res.status(200).json(ranks);
    } catch (error) {
        next(error);
    }
}

// Función para crear un nuevo rango de EloBoost
async function createEloBoostRank(req, res, next) {
    try {
        const { name, order, rankUpPriceRPId, divisionPriceRPId, divisions } = req.body;

        // Validar campos requeridos
        if (!name || order === undefined || !rankUpPriceRPId || !divisionPriceRPId) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Nombre, orden, ID de precio RP para rango y ID de precio RP para división son requeridos'
            );
        }

        // Verificar que los precios RP existen
        const rankUpPriceRP = await RPPrice.findById(rankUpPriceRPId);
        const divisionPriceRP = await RPPrice.findById(divisionPriceRPId);

        if (!rankUpPriceRP || !divisionPriceRP) {
            throw new CustomError(
                'Precios RP no encontrados',
                404,
                'Uno o ambos precios RP especificados no existen'
            );
        }

        // Validar que no exista un rango con el mismo nombre u orden
        const existingRank = await EloBoostRank.findOne({
            $or: [{ name }, { order }]
        });

        if (existingRank) {
            throw new CustomError(
                'Rango duplicado',
                400,
                'Ya existe un rango con ese nombre u orden'
            );
        }

        // Manejar el icono
        if (!req.file) {
            throw new CustomError(
                'Archivo no proporcionado',
                400,
                'Se requiere un icono para el rango'
            );
        }

        const uploadDir = ensureIconDirectoryExists();
        const icon = req.file;
        const fileExtension = path.extname(icon.originalname);
        const fileName = `eloboost-${name.toLowerCase().replace(/\\s+/g, '-')}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        
        // Mover icono al directorio de destino
        fs.renameSync(icon.path, filePath);

        // Procesar divisiones si se proporcionan
        let rankDivisions = divisions ? JSON.parse(divisions) : [
            { name: 'IV', order: 0 },
            { name: 'III', order: 1 },
            { name: 'II', order: 2 },
            { name: 'I', order: 3 }
        ];

        // Crear nuevo rango
        const newRank = new EloBoostRank({
            name,
            order,
            rankUpPriceRP: rankUpPriceRPId,
            divisionPriceRP: divisionPriceRPId,
            divisions: rankDivisions,
            icon: `/RankIcons/${fileName}`
        });

        await newRank.save();

        res.status(201).json(newRank);
    } catch (error) {
        next(error);
    }
}

// Función para actualizar un rango existente
async function updateEloBoostRank(req, res, next) {
    try {
        const { id } = req.params;
        const { name, order, rankUpPriceRPId, divisionPriceRPId, divisions, active } = req.body;
        
        const oldRank = await EloBoostRank.findById(id);
        if (!oldRank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Verificar duplicados solo si se está actualizando nombre o orden
        if (name || order !== undefined) {
            const existingRank = await EloBoostRank.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(order !== undefined ? [{ order }] : [])
                ]
            });

            if (existingRank) {
                throw new CustomError(
                    'Rango duplicado',
                    400,
                    'Ya existe un rango con ese nombre u orden'
                );
            }
        }

        // Verificar precios RP si se proporcionan
        if (rankUpPriceRPId) {
            const rankUpPriceRP = await RPPrice.findById(rankUpPriceRPId);
            if (!rankUpPriceRP) {
                throw new CustomError('Precio RP para rango no encontrado', 404);
            }
        }

        if (divisionPriceRPId) {
            const divisionPriceRP = await RPPrice.findById(divisionPriceRPId);
            if (!divisionPriceRP) {
                throw new CustomError('Precio RP para división no encontrado', 404);
            }
        }

        // Preparar datos de actualización
        let updateData = { 
            name: name || oldRank.name,
            order: order !== undefined ? order : oldRank.order,
            rankUpPriceRP: rankUpPriceRPId || oldRank.rankUpPriceRP,
            divisionPriceRP: divisionPriceRPId || oldRank.divisionPriceRP,
            active: active !== undefined ? active : oldRank.active
        };

        // Procesar divisiones si se proporcionan
        if (divisions) {
            updateData.divisions = JSON.parse(divisions);
        }

        // Manejar actualización de icono si se proporciona
        if (req.file) {
            const uploadDir = ensureIconDirectoryExists();

            // Eliminar icono anterior si no es el predeterminado
            const oldPath = path.join(__dirname, '..', oldRank.icon);
            if (fs.existsSync(oldPath) && !oldRank.icon.includes('default')) {
                fs.unlinkSync(oldPath);
            }

            // Guardar nuevo icono
            const icon = req.file;
            const fileExtension = path.extname(icon.originalname);
            const fileName = `eloboost-${(name || oldRank.name).toLowerCase().replace(/\\s+/g, '-')}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            fs.renameSync(icon.path, filePath);

            updateData.icon = `/RankIcons/${fileName}`;
        }

        // Actualizar rango
        const updatedRank = await EloBoostRank.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('rankUpPriceRP').populate('divisionPriceRP');

        res.status(200).json(updatedRank);
    } catch (error) {
        next(error);
    }
}

// Función para eliminar un rango
async function deleteEloBoostRank(req, res, next) {
    try {
        const { id } = req.params;
        const rank = await EloBoostRank.findById(id);

        if (!rank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Eliminar icono del sistema de archivos si no es el predeterminado
        if (!rank.icon.includes('default')) {
            const filePath = path.join(__dirname, '..', rank.icon);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Eliminar rango de la base de datos
        await EloBoostRank.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Rango eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
}

// Función para calcular el costo de un boost
async function calculateBoostCost(req, res, next) {
    try {
        const { 
            currentRankId, currentDivision,
            targetRankId, targetDivision,
            specificRole, specificChampion, duoQueue,
            currencyId  // Nueva opción para seleccionar moneda
        } = req.body;

        // Validar datos requeridos
        if (!currentRankId || !currentDivision || !targetRankId || !targetDivision) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Se requieren rangos y divisiones actuales y objetivo'
            );
        }

        // Obtener rangos
        const currentRank = await EloBoostRank.findById(currentRankId).populate('rankUpPriceRP').populate('divisionPriceRP');
        const targetRank = await EloBoostRank.findById(targetRankId).populate('rankUpPriceRP').populate('divisionPriceRP');

        if (!currentRank || !targetRank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Validar que el objetivo sea mayor que el actual
        if (targetRank.order < currentRank.order || 
            (targetRank.order === currentRank.order && 
             getOrderFromDivision(targetDivision) <= getOrderFromDivision(currentDivision))) {
            throw new CustomError(
                'Combinación inválida',
                400,
                'El rango objetivo debe ser mayor que el rango actual'
            );
        }

        // Calcular el precio base en RP
        let baseRPPrice = 0;
        
        // Si son rangos diferentes
        if (targetRank.order > currentRank.order) {
            // Agregar el costo de las divisiones restantes en el rango actual
            const currentDivIndex = getOrderFromDivision(currentDivision);
            const maxDivIndex = currentRank.divisions.length - 1;
            
            // Usar el valor de RP en lugar del precio directo
            baseRPPrice += (maxDivIndex - currentDivIndex) * currentRank.divisionPriceRP.valueRP;
            
            // Sumar el costo de cambio de rango a todos los rangos intermedios
            const allRanks = await EloBoostRank.find().populate('rankUpPriceRP').populate('divisionPriceRP').sort({ order: 1 });
            
            let foundCurrent = false;
            let includeRank = false;
            
            for (const rank of allRanks) {
                if (rank._id.toString() === currentRank._id.toString()) {
                    foundCurrent = true;
                    continue;
                }
                
                if (foundCurrent && rank._id.toString() !== targetRank._id.toString()) {
                    baseRPPrice += rank.rankUpPriceRP.valueRP;
                }
                
                if (rank._id.toString() === targetRank._id.toString()) {
                    // Agregar el costo base del rango objetivo
                    baseRPPrice += rank.rankUpPriceRP.valueRP;
                    break;
                }
            }
            
            // Agregar el costo de las divisiones en el rango objetivo
            const targetDivIndex = getOrderFromDivision(targetDivision);
            for (let i = 0; i < targetDivIndex; i++) {
                baseRPPrice += targetRank.divisionPriceRP.valueRP;
            }
        } else {
            // Si es el mismo rango, calcular la diferencia de divisiones
            const currentDivIndex = getOrderFromDivision(currentDivision);
            const targetDivIndex = getOrderFromDivision(targetDivision);
            
            baseRPPrice = (targetDivIndex - currentDivIndex) * currentRank.divisionPriceRP.valueRP;
        }

        // El precio es fijo, no depende del LP actual

        // Obtener configuración de adicionales
        const config = await EloBoostConfig.getConfig();
        
        // Calcular costos adicionales en RP
        let additionalRPCost = 0;
        
        if (specificRole) {
            additionalRPCost += baseRPPrice * (config.specificRolePricePercent / 100);
        }
        
        if (specificChampion) {
            additionalRPCost += baseRPPrice * (config.specificChampionPricePercent / 100);
        }
        
        if (duoQueue) {
            additionalRPCost += baseRPPrice * (config.duoQueuePricePercent / 100);
        }

        const totalRPCost = baseRPPrice + additionalRPCost;

        // Conversión a la moneda solicitada si se proporciona currencyId
        let basePrice = 0;
        let additionalCost = 0;
        let totalCost = 0;
        let currencyDetails = null;

        if (currencyId) {
            // Necesitamos obtener todas las conversiones de todos los rangos involucrados
            const allRanks = await EloBoostRank.find()
                .populate('rankUpPriceRP')
                .populate('divisionPriceRP')
                .sort({ order: 1 });
            
            // Crear un mapa de conversiones para cada precio RP único
            const conversionsMap = new Map();
            
            // Obtener todas las conversiones necesarias
            for (const rank of allRanks) {
                if (rank.rankUpPriceRP && !conversionsMap.has(rank.rankUpPriceRP._id.toString())) {
                    const conversion = await RPPriceConversion.findOne({
                        rpPrice: rank.rankUpPriceRP._id,
                        currency: currencyId
                    });
                    if (conversion) {
                        conversionsMap.set(rank.rankUpPriceRP._id.toString(), conversion);
                    }
                }
                
                if (rank.divisionPriceRP && !conversionsMap.has(rank.divisionPriceRP._id.toString())) {
                    const conversion = await RPPriceConversion.findOne({
                        rpPrice: rank.divisionPriceRP._id,
                        currency: currencyId
                    });
                    if (conversion) {
                        conversionsMap.set(rank.divisionPriceRP._id.toString(), conversion);
                    }
                }
            }
            
            // Ahora calculamos el precio total sumando las conversiones individuales
            basePrice = 0;
            
            // Recalcular el precio teniendo en cuenta las conversiones específicas
            if (targetRank.order > currentRank.order) {
                // Divisiones restantes en el rango actual
                const currentDivIndex = getOrderFromDivision(currentDivision);
                const maxDivIndex = currentRank.divisions.length - 1;
                const remainingDivisions = maxDivIndex - currentDivIndex;
                
                const currentDivConversion = conversionsMap.get(currentRank.divisionPriceRP._id.toString());
                if (currentDivConversion) {
                    basePrice += remainingDivisions * currentDivConversion.priceSeguro;
                }
                
                // Rangos intermedios
                let foundCurrent = false;
                for (const rank of allRanks) {
                    if (rank._id.toString() === currentRank._id.toString()) {
                        foundCurrent = true;
                        continue;
                    }
                    
                    if (foundCurrent && rank._id.toString() !== targetRank._id.toString()) {
                        const rankUpConversion = conversionsMap.get(rank.rankUpPriceRP._id.toString());
                        if (rankUpConversion) {
                            basePrice += rankUpConversion.priceSeguro;
                        }
                    }
                    
                    if (rank._id.toString() === targetRank._id.toString()) {
                        // Costo del rango objetivo
                        const targetRankUpConversion = conversionsMap.get(rank.rankUpPriceRP._id.toString());
                        if (targetRankUpConversion) {
                            basePrice += targetRankUpConversion.priceSeguro;
                        }
                        break;
                    }
                }
                
                // Divisiones en el rango objetivo
                const targetDivIndex = getOrderFromDivision(targetDivision);
                const targetDivConversion = conversionsMap.get(targetRank.divisionPriceRP._id.toString());
                if (targetDivConversion) {
                    basePrice += targetDivIndex * targetDivConversion.priceSeguro;
                }
            } else {
                // Mismo rango, diferente división
                const currentDivIndex = getOrderFromDivision(currentDivision);
                const targetDivIndex = getOrderFromDivision(targetDivision);
                const divisionDiff = targetDivIndex - currentDivIndex;
                
                const currentDivConversion = conversionsMap.get(currentRank.divisionPriceRP._id.toString());
                if (currentDivConversion) {
                    basePrice = divisionDiff * currentDivConversion.priceSeguro;
                }
            }
            
            // Calcular costos adicionales en la moneda seleccionada
            additionalCost = basePrice * (additionalRPCost / baseRPPrice);
            totalCost = basePrice + additionalCost;

            // Obtener detalles de la moneda para incluirlos en la respuesta
            const Currency = require('../database/Models/currencyModel');
            currencyDetails = await Currency.findById(currencyId, 'name symbol code');
        }

        // Respuesta con todos los detalles
        res.status(200).json({
            baseRPPrice,
            additionalRPCost,
            totalRPCost,
            // Precios convertidos si se proporcionó moneda
            ...(currencyId && {
                basePrice,
                additionalCost,
                totalCost,
                currency: currencyDetails
            }),
            details: {
                currentRank: {
                    _id: currentRank._id,
                    name: currentRank.name,
                    division: currentDivision
                },
                targetRank: {
                    _id: targetRank._id,
                    name: targetRank.name,
                    division: targetDivision
                },
                options: {
                    specificRole,
                    specificChampion,
                    duoQueue
                }
            }
        });
    } catch (error) {
        next(error);
    }
}

// Función auxiliar para convertir la división a su orden numérico
function getOrderFromDivision(division) {
    switch (division) {
        case 'IV': return 0;
        case 'III': return 1;
        case 'II': return 2;
        case 'I': return 3;
        default: return 0;
    }
}

module.exports = {
    getAllEloBoostRanks,
    createEloBoostRank,
    updateEloBoostRank,
    deleteEloBoostRank,
    calculateBoostCost
};
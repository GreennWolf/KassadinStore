const Champion = require('../database/Models/championModel');
const Skin = require('../database/Models/skinModel');
const fs = require('fs').promises;
const path = require('path');
const { CustomError } = require('../middlewares/errorHandler');

const IMAGE_BASE_DIR = path.join(__dirname, '../public/images');

const formatName = (name) => name.replace(/\s+/g, '-');

async function handleImageUpload(file, championName, skinName = null) {
    if (!file) return null;

    const formattedChampName = formatName(championName);
    const filename = skinName ? 
        `${formatName(skinName)}.${file.originalname.split('.').pop()}` :
        `${formattedChampName}.${file.originalname.split('.').pop()}`;
    
    const championDir = path.join(IMAGE_BASE_DIR, formattedChampName);
    const filepath = path.join(championDir, filename);

    try {
        await fs.mkdir(championDir, { recursive: true });
        await fs.writeFile(filepath, file.buffer);
        return `${formattedChampName}/${filename}`;
    } catch (error) {
        throw new CustomError('Error al guardar la imagen', 500);
    }
}

const championController = {
    getAllChampions: async (req, res, next) => {
        try {
            const champions = await Champion.find();
            res.json(champions);
        } catch (error) {
            next(error);
        }
    },

    getChampionById: async (req, res, next) => {
        try {
            const champion = await Champion.findById(req.params.id);
            if (!champion) {
                throw new CustomError('Campeón no encontrado', 404);
            }
            res.json(champion);
        } catch (error) {
            next(error);
        }
    },

    createChampion: async (req, res, next) => {
        try {
            const championData = req.body;
            
            if (req.file) {
                championData.srcLocal = await handleImageUpload(req.file, championData.name);
            }

            const champion = await Champion.create(championData);
            res.status(201).json(champion);
        } catch (error) {
            next(error);
        }
    },

    updateChampion: async (req, res, next) => {
        try {
            const championData = req.body;
            const oldChampion = await Champion.findById(req.params.id);
            
            if (!oldChampion) {
                throw new CustomError('Campeón no encontrado', 404);
            }

            if (req.file) {
                if (championData.name !== oldChampion.name) {
                    const oldPath = path.join(IMAGE_BASE_DIR, formatName(oldChampion.name));
                    const newPath = path.join(IMAGE_BASE_DIR, formatName(championData.name));
                    await fs.rename(oldPath, newPath).catch(console.warn);
                }

                championData.srcLocal = await handleImageUpload(req.file, championData.name);
            }

            const champion = await Champion.findByIdAndUpdate(
                req.params.id,
                championData,
                { new: true }
            );

            res.json(champion);
        } catch (error) {
            next(error);
        }
    },

    deleteChampion: async (req, res, next) => {
        try {
            const champion = await Champion.findById(req.params.id);
            if (!champion) {
                throw new CustomError('Campeón no encontrado', 404);
            }

            const championDir = path.join(IMAGE_BASE_DIR, formatName(champion.name));
            await Promise.all([
                fs.rm(championDir, { recursive: true, force: true }),
                Skin.deleteMany({ champion: champion._id }),
                champion.deleteOne()
            ]);

            res.json({ message: 'Campeón y sus skins eliminados correctamente' });
        } catch (error) {
            next(error);
        }
    }
};

const skinController = {
    getAllSkins: async (req, res, next) => {
        try {
            const page = parseInt(req.query.page);
            const limit = parseInt(req.query.limit);
            const search = req.query.search || '';
            const subcategory = req.query.subcategory || 'all';
            const showAll = req.query.showAll === 'true';
            const orderByNew = req.query.orderByNew === 'true';
            const reward = req.query.reward === 'true'; // Nuevo parámetro
            const skip = (page - 1) * limit;
    
            let query = {};
            
            // Solo aplicar filtro de activos si no queremos ver todos
            if (!showAll) {
                query.active = true;
            }
    
            // Aplicar filtro de reward si está especificado
            if (reward) {
                query.reward = true;
            }
    
            if (search) {
                query.NombreSkin = { $regex: search, $options: 'i' };
            }
    
            if (subcategory === 'chromas') {
                query.type = 'chromas';
            } else if (subcategory === 'bundles') {
                query.type = 'bundle';
            } else {
                query.type = { $nin: ['chromas', 'bundle'] };
            }
    
            const sortStage = orderByNew 
                ? { 
                    $sort: { 
                        'new': -1,
                        'championData.name': 1,
                        'NombreSkin': 1
                    } 
                }
                : { 
                    $sort: { 
                        'championData.name': 1,
                        'NombreSkin': 1 
                    } 
                };
    
            let aggregationPipeline = [
                { $match: query },
                {
                    $lookup: {
                        from: 'champions',
                        localField: 'champion',
                        foreignField: '_id',
                        as: 'championData'
                    }
                },
                { $unwind: '$championData' },
                {
                    $lookup: {
                        from: 'rpprices',
                        localField: 'priceRP',
                        foreignField: '_id',
                        as: 'priceRPData'
                    }
                },
                { $unwind: '$priceRPData' },
                sortStage
            ];
    
            // Solo aplicar paginación si limit no es 0
            if (limit !== 0) {
                aggregationPipeline.push(
                    { $skip: skip },
                    { $limit: limit }
                );
            }
    
            const [skins, total] = await Promise.all([
                Skin.aggregate(aggregationPipeline),
                Skin.countDocuments(query)
            ]);
    
            res.json({
                data: skins,
                total,
                currentPage: limit === 0 ? 1 : page,
                totalPages: limit === 0 ? 1 : Math.ceil(total / limit),
                hasMore: limit !== 0 ? skip + skins.length < total : false
            });
        } catch (error) {
            next(error);
        }
    },

    getSkinById: async (req, res, next) => {
        try {
            const skin = await Skin.findById(req.params.id).populate('champion');
            if (!skin) {
                throw new CustomError('Skin no encontrada', 404);
            }
            res.json(skin);
        } catch (error) {
            next(error);
        }
    },

    getSkinsByChampionId: async (req, res, next) => {
        try {
            const { championId } = req.params;
            const champion = await Champion.findById(championId);
            
            if (!champion) {
                throw new CustomError('Campeón no encontrado', 404);
            }

            const skins = await Skin.find({ champion: championId })
                .populate('champion')
                .populate('priceRP');

            if (!skins.length) {
                throw new CustomError('No se encontraron skins para este campeón', 404);
            }

            const formattedSkins = skins.map(skin => {
                const skinData = skin.toObject();
                if (skinData.srcLocal) {
                    skinData.srcLocal = path.join(
                        formatName(champion.name),
                        skinData.srcLocal
                    );
                }
                return skinData;
            });

            res.json({
                success: true,
                data: formattedSkins,
                count: formattedSkins.length
            });
        } catch (error) {
            next(error);
        }
    },

    createSkin: async (req, res, next) => {
        try {
            const skinData = req.body;
            const champion = await Champion.findById(skinData.champion);
            
            if (!champion) {
                throw new CustomError('Campeón no encontrado', 404);
            }

            if (req.file) {
                const filename = await handleImageUpload(req.file, champion.name, skinData.NombreSkin);
                skinData.src = filename;
                skinData.srcLocal = filename;
            }

            const skin = await Skin.create(skinData);
            const populatedSkin = await Skin.findById(skin._id).populate('champion');
            
            res.status(201).json(populatedSkin);
        } catch (error) {
            next(error);
        }
    },

    updateSkin: async (req, res, next) => {
        try {
            const skinData = req.body;

            const oldSkin = await Skin.findById(req.params.id).populate('champion');
            
            if (!oldSkin) {
                throw new CustomError('Skin no encontrada', 404);
            }

            if (req.file) {
                const champion = await Champion.findById(skinData.champion || oldSkin.champion._id);
                if (!champion) {
                    throw new CustomError('Campeón no encontrado', 404);
                }

                if (oldSkin.srcLocal) {
                    const oldImagePath = path.join(IMAGE_BASE_DIR, oldSkin.srcLocal);
                    await fs.unlink(oldImagePath).catch(console.warn);
                }

                skinData.srcLocal = await handleImageUpload(
                    req.file, 
                    champion.name, 
                    skinData.NombreSkin || oldSkin.NombreSkin
                );
            }

            const skin = await Skin.findByIdAndUpdate(
                req.params.id,
                skinData,
                { new: true }
            ).populate('champion');

            res.json(skin);
        } catch (error) {
            next(error);
        }
    },

    deleteSkin: async (req, res, next) => {
        try {
            const skin = await Skin.findById(req.params.id).populate('champion');
            
            if (!skin) {
                throw new CustomError('Skin no encontrada', 404);
            }

            await skin.updateOne({active:false});
            res.json({ message: 'Skin eliminada correctamente' });
        } catch (error) {
            next(error);
        }
    },

    activeSkin: async (req, res, next) => {
        try {
            const skin = await Skin.findById(req.params.id).populate('champion');
            
            if (!skin) {
                throw new CustomError('Skin no encontrada', 404);
            }

            await skin.updateOne({active:true});
            res.json({ message: 'Skin activada correctamente' });
        } catch (error) {
            next(error);
        }
    },

    getAllNewSkins: async (req, res, next) => {
        try {
            const newSkins = await Skin.find({ new: true }).populate('champion');
            res.json(newSkins);
        } catch (error) {
            next(error);
        }
    },
    // Añadir estas funciones al objeto skinController en championController.js

    getAllDestacados: async (req, res, next) => {
        try {
            const destacadoSkins = await Skin.find({ destacado: true })
                .populate('champion')
                .populate('priceRP');
            res.json(destacadoSkins);
        } catch (error) {
            next(error);
        }
    },

    toggleDestacado: async (req, res, next) => {
        try {
            const skin = await Skin.findById(req.params.id).populate('champion');
            
            if (!skin) {
                throw new CustomError('Skin no encontrada', 404);
            }

            // Cambiar el valor de destacado (toggle)
            const nuevoEstadoDestacado = !skin.destacado;
            
            await skin.updateOne({ destacado: nuevoEstadoDestacado });
            
            res.json({ 
                message: nuevoEstadoDestacado ? 
                    'Skin marcada como destacada correctamente' : 
                    'Skin desmarcada como destacada correctamente',
                destacado: nuevoEstadoDestacado
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = {
    ...championController,
    ...skinController
};
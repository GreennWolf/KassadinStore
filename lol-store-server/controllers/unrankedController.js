const Unrankeds = require('../database/Models/unrankedModel');
const RPPrice = require('../database/Models/rpPrice');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const { CustomError } = require('../middlewares/errorHandler');

// Configuración de multer
const UNRANKEDS_DIRECTORY = 'public/unrankeds';

if (!fs.existsSync(UNRANKEDS_DIRECTORY)) {
    fs.mkdirSync(UNRANKEDS_DIRECTORY, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UNRANKEDS_DIRECTORY),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const titulo = req.body.titulo || 'unranked';
        const extension = path.extname(file.originalname);
        cb(null, `${titulo}-${timestamp}${extension}`);
    }
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new CustomError('Solo se permiten archivos JPG, PNG, GIF y WebP', 400));
        }
    }
});

const unrankedsController = {
    // Crear cuenta unranked
    async createUnranked(req, res, next) {
        try {
            console.log("Recibiendo solicitud para crear unranked");
            console.log("Headers:", req.headers);
            console.log("Body:", req.body);
            console.log("File:", req.file);
            
            const { 
                titulo, 
                priceRP, 
                srcWeb, 
                escencia, 
                nivel, 
                rpAmount, 
                region,
                handUpgrade,
                escenciaNaranja 
            } = req.body;
            
            // Verificación de campos requeridos con más detalle
            const missingFields = [];
            if (!titulo) missingFields.push('titulo');
            if (!priceRP) missingFields.push('priceRP');
            if (!nivel) missingFields.push('nivel');
            if (!rpAmount) missingFields.push('rpAmount');
            if (!region) missingFields.push('region');
            if (!escenciaNaranja) missingFields.push('escenciaNaranja');
            
            if (missingFields.length > 0) {
                console.error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
                throw new CustomError(`Faltan campos requeridos: ${missingFields.join(', ')}`, 400);
            }

            // Procesar skins - manejar múltiples formatos posibles
            let skins = [];
            
            // Caso 1: skins como JSON string
            if (typeof req.body.skins === 'string') {
                try {
                    if (req.body.skins.startsWith('[') && req.body.skins.endsWith(']')) {
                        skins = JSON.parse(req.body.skins);
                    } else {
                        skins = req.body.skins.split(',').map(id => id.trim()).filter(id => id);
                    }
                } catch (error) {
                    console.warn("Error parseando skins como JSON:", error);
                }
            } 
            // Caso 2: skins ya como array
            else if (Array.isArray(req.body.skins)) {
                skins = req.body.skins;
            } 
            // Caso 3: skins[] de formdata
            else if (req.body['skins[]']) {
                skins = Array.isArray(req.body['skins[]']) 
                    ? req.body['skins[]'] 
                    : [req.body['skins[]']];
            }
            
            // Validar IDs de skins
            const validSkins = skins.filter(id => {
                try {
                    return mongoose.Types.ObjectId.isValid(id);
                } catch (error) {
                    console.warn(`ID de skin inválido: ${id}`);
                    return false;
                }
            });
            
            console.log(`Total de skins válidas: ${validSkins.length}`);

            // Extraer el stock de la solicitud o usar valor por defecto
            const stock = req.body.stock ? parseInt(req.body.stock) : 1;
            
            // Construir el objeto de datos para la cuenta
            const unrankedData = {
                titulo: titulo.trim(),
                priceRP,
                srcWeb: srcWeb?.trim() || '',
                escencia: parseInt(escencia) || 0,
                nivel: parseInt(nivel),
                rpAmount: parseInt(rpAmount),
                region,
                escenciaNaranja: parseInt(escenciaNaranja) || 0,
                handUpgrade: handUpgrade === 'false' ? false : Boolean(handUpgrade),
                skins: validSkins,
                stock: stock > 0 ? stock : 1, // Asegurar que el stock sea al menos 1
                ...(req.file && { srcLocal: req.file.filename })
            };
            
            console.log("Datos a guardar:", unrankedData);

            // Crear y guardar el nuevo documento
            const newUnranked = new Unrankeds(unrankedData);
            await newUnranked.save();

            // Obtener el documento poblado
            const populatedUnranked = await Unrankeds.findById(newUnranked._id)
                .populate('priceRP')
                .populate('skins');
            
            console.log("Cuenta unranked creada con éxito");
            res.status(201).json(populatedUnranked);
        } catch (error) {
            console.error("Error creando unranked:", error);
            next(error);
        }
    },

    // Obtener todas las cuentas unranked
    async getAllUnrankeds(req, res, next) {
        try {
            const {
                page = 1,
                limit = 20,
                search = '',
                skinSearch = '', // Búsqueda de skins
                region,
                minLevel,
                maxLevel,
                minRP,
                maxRP,
                showAll = false,
                includeSearch = 'false' // Para búsqueda inclusiva (palabras sueltas)
            } = req.query;

            const skip = (page - 1) * limit;
            let query = {};
            
            if (!showAll) {
                query.active = true;
            }

            const isInclusiveSearch = includeSearch === 'true';

            // Búsqueda por título de la cuenta
            if (search) {
                // Si es búsqueda inclusiva y contiene espacios
                if (isInclusiveSearch && search.includes(' ')) {
                    const titleKeywords = search.split(' ').filter(k => k.trim().length > 0);
                    
                    // Crear condiciones de búsqueda para el título
                    const titleConditions = titleKeywords.map(keyword => ({
                        titulo: { $regex: keyword.trim(), $options: 'i' }
                    }));
                    
                    // Añadir a la consulta si hay palabras clave
                    if (titleConditions.length > 0) {
                        query.$or = titleConditions;
                    }
                } else if (isInclusiveSearch && search.includes('|')) {
                    // Si usa el formato con pipe (|) para términos separados
                    const titleKeywords = search.split('|').filter(k => k.trim().length > 0);
                    
                    // Crear condiciones de búsqueda para título
                    const titleConditions = titleKeywords.map(keyword => ({
                        titulo: { $regex: keyword.trim(), $options: 'i' }
                    }));
                    
                    // Añadir a la consulta si hay palabras clave
                    if (titleConditions.length > 0) {
                        query.$or = titleConditions;
                    }
                } else {
                    // Búsqueda simple tradicional
                    query.titulo = { $regex: search, $options: 'i' };
                }
            }
            
            // Preparar términos de búsqueda para skins
            let keywords = [];
            
            // Procesar búsqueda principal si es inclusiva
            if (search && isInclusiveSearch) {
                if (search.includes(' ')) {
                    // Dividir por espacios si contiene espacios
                    keywords = [...keywords, ...search.split(' ').filter(k => k.trim().length > 0)];
                } else if (search.includes('|')) {
                    // Dividir por | si usa ese formato
                    keywords = [...keywords, ...search.split('|').filter(k => k.trim().length > 0)];
                } else {
                    // Término único
                    keywords.push(search);
                }
            }
            
            // Procesar términos específicos de búsqueda de skins
            if (skinSearch) {
                // Dividir en palabras si tiene espacios
                if (skinSearch.includes(' ')) {
                    keywords = [...keywords, ...skinSearch.split(' ').filter(k => k.trim().length > 0)];
                } else if (skinSearch.includes('|')) {
                    // Dividir por | si usa ese formato
                    keywords = [...keywords, ...skinSearch.split('|').filter(k => k.trim().length > 0)];
                } else {
                    // Término único
                    keywords.push(skinSearch);
                }
            }
            
            // Eliminar duplicados, palabras muy cortas, y normalizar
            keywords = [...new Set(keywords)]
                .filter(k => k.trim().length > 1)
                .map(k => k.trim().toLowerCase());
            
            console.log("Términos de búsqueda final:", keywords);
            
            // Si hay términos de búsqueda de skins, necesitamos un enfoque diferente
            if (keywords.length > 0) {
                console.log("Buscando por los siguientes términos:", keywords);
                
                try {
                    // Primero buscar las skins que coincidan con cualquiera de los términos
                    const Skins = mongoose.model('Skin');
                    
                    // Crear condiciones de búsqueda para skins
                    const skinSearchConditions = [];
                    
                    // Agregar condiciones para buscar en el nombre de la skin
                    for (const keyword of keywords) {
                        skinSearchConditions.push({ 
                            NombreSkin: { $regex: keyword, $options: 'i' }
                        });
                    }
                    
                    // Obtener IDs de las skins que coinciden
                    const matchingSkins = await Skins.find({ 
                        $or: skinSearchConditions,
                        active: true // Asegurarse de que las skins estén activas
                    })
                    .populate('champion') // Poblar campeón para poder buscar también por nombre de campeón
                    .exec();
                    
                    console.log(`Encontradas ${matchingSkins.length} skins que coinciden con la búsqueda`);
                    
                    // Filtrar también por nombre de campeón
                    const filteredSkins = matchingSkins.filter(skin => {
                        // Si ya coincide por nombre de skin, incluirla
                        const skinNameMatches = keywords.some(keyword => 
                            skin.NombreSkin.toLowerCase().includes(keyword.toLowerCase())
                        );
                        
                        if (skinNameMatches) return true;
                        
                        // Comprobar si coincide por nombre de campeón
                        if (skin.champion && skin.champion.name) {
                            return keywords.some(keyword => 
                                skin.champion.name.toLowerCase().includes(keyword.toLowerCase())
                            );
                        }
                        
                        return false;
                    });
                    
                    console.log(`Después de filtrar por campeón: ${filteredSkins.length} skins`);
                    
                    // Obtener los IDs de las skins filtradas
                    const skinIds = filteredSkins.map(skin => skin._id);
                    
                    // Si no encontramos skins, devolver array vacío
                    if (skinIds.length === 0) {
                        console.log("No se encontraron skins que coincidan con los términos");
                        // Añadir una condición imposible para que no devuelva resultados
                        query._id = { $in: [] };
                    } else {
                        console.log(`Buscando cuentas que contengan alguna de las ${skinIds.length} skins`);
                        
                        // Añadir condición para buscar cuentas que tengan alguna de estas skins
                        if (query.$and) {
                            query.$and.push({ skins: { $in: skinIds } });
                        } else {
                            query.$and = [{ skins: { $in: skinIds } }];
                        }
                    }
                } catch (error) {
                    console.error("Error en la búsqueda de skins:", error);
                    // En caso de error, continuar con la consulta original
                }
            }

            // Filtrar por región
            if (region) {
                query.region = region;
            }

            // Filtrar por nivel
            if (minLevel || maxLevel) {
                query.nivel = {};
                if (minLevel) query.nivel.$gte = parseInt(minLevel);
                if (maxLevel) query.nivel.$lte = parseInt(maxLevel);
            }

            // Filtrar por cantidad de RP
            if (minRP || maxRP) {
                query.rpAmount = {};
                if (minRP) query.rpAmount.$gte = parseInt(minRP);
                if (maxRP) query.rpAmount.$lte = parseInt(maxRP);
            }

            console.log("Consulta final MongoDB:", JSON.stringify(query, null, 2));

            // Ejecutar consulta con límites de paginación
            const [unrankeds, total] = await Promise.all([
                Unrankeds.find(query)
                    .populate('priceRP')
                    .populate({
                        path: 'skins',
                        populate: [
                            {
                                path: 'champion',
                                model: 'Champion'
                            },
                            {
                                path: 'priceRP',
                                model: 'RPPrice'
                            }
                        ]
                    })
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Unrankeds.countDocuments(query)
            ]);

            // Formatear resultados para la respuesta
            res.json({
                data: unrankeds,
                total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                hasMore: skip + unrankeds.length < total
            });
        } catch (error) {
            console.error("Error al obtener cuentas unranked:", error);
            next(error);
        }
    },

    // Obtener una cuenta unranked por ID
    async getUnrankedById(req, res, next) {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new CustomError('ID de cuenta no válido', 400);
            }

            const unranked = await Unrankeds.findById(id)
                .populate('priceRP')
                .populate({
                    path: 'skins',
                    populate: {
                        path: 'champion',
                        model: 'Champion'
                    }
                });

            if (!unranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json(unranked);
        } catch (error) {
            next(error);
        }
    },

    // Actualizar cuenta unranked
    async updateUnranked(req, res, next) {
        try {
            console.log("Actualizando unranked con ID:", req.params.id);
            console.log("Headers:", req.headers);
            console.log("Body:", req.body);
            console.log("File:", req.file);
            
            const { id } = req.params;
            const updateData = { ...req.body };

            // Manejar correctamente el array de skins
            if (req.body['skins[]']) {
                // Si viene como skins[], convertirlo a array
                const skinIds = Array.isArray(req.body['skins[]']) 
                    ? req.body['skins[]'] 
                    : [req.body['skins[]']];
                
                // Reemplazar en updateData y eliminar la entrada original
                updateData.skins = skinIds;
                delete updateData['skins[]'];
                
                console.log("Skins actualizadas desde skins[]:", skinIds);
            } else if (typeof req.body.skins === 'string') {
                // Si es un string, intentar parsearlo como JSON
                try {
                    if (req.body.skins.startsWith('[') && req.body.skins.endsWith(']')) {
                        updateData.skins = JSON.parse(req.body.skins);
                    } else {
                        updateData.skins = req.body.skins.split(',').map(id => id.trim()).filter(id => id);
                    }
                    
                    console.log("Skins actualizadas desde string JSON:", updateData.skins);
                } catch (error) {
                    console.error("Error parseando skins como JSON:", error);
                    updateData.skins = [];
                }
            }
            
            // Validar que todos los IDs sean válidos
            if (updateData.skins && Array.isArray(updateData.skins)) {
                updateData.skins = updateData.skins.filter(id => mongoose.Types.ObjectId.isValid(id));
                console.log(`Skins válidas después de filtrar: ${updateData.skins.length}`);
            }

            // Procesar el stock si se proporciona
            if (updateData.stock) {
                updateData.stock = parseInt(updateData.stock);
                
                // Si el stock llega a 0 o es negativo, desactivar la cuenta
                if (updateData.stock <= 0) {
                    console.log(`Stock en 0 o negativo (${updateData.stock}), desactivando cuenta`);
                    updateData.stock = 0;
                    updateData.active = false;
                }
            }
            
            // Manejar la imagen si se proporciona una nueva
            if (req.file) {
                const currentUnranked = await Unrankeds.findById(id);
                if (currentUnranked?.srcLocal) {
                    const oldImagePath = path.join(UNRANKEDS_DIRECTORY, currentUnranked.srcLocal);
                    await fsPromises.unlink(oldImagePath).catch(console.warn);
                }
                updateData.srcLocal = req.file.filename;
            }
            
            console.log("Datos a actualizar:", updateData);

            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )
            .populate('priceRP')
            .populate({
                path: 'skins',
                populate: {
                    path: 'champion',
                    model: 'Champion'
                }
            });

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }
            
            console.log("Cuenta actualizada con éxito");
            res.status(200).json(updatedUnranked);
        } catch (error) {
            console.error("Error actualizando unranked:", error);
            next(error);
        }
    },

    // Desactivar cuenta unranked
    async deactivateUnranked(req, res, next) {
        try {
            const { id } = req.params;
            
            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                { active: false },
                { new: true }
            )
            .populate('priceRP')
            .populate('skins');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json({ 
                message: 'Cuenta unranked desactivada correctamente',
                unranked: updatedUnranked
            });
        } catch (error) {
            next(error);
        }
    },

    // Activar cuenta unranked
    async activateUnranked(req, res, next) {
        try {
            const { id } = req.params;
            
            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                { active: true },
                { new: true }
            )
            .populate('priceRP')
            .populate('skins');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json({ 
                message: 'Cuenta unranked activada correctamente',
                unranked: updatedUnranked
            });
        } catch (error) {
            next(error);
        }
    },

    // Añadir skins a una cuenta unranked
    async addSkinsToUnranked(req, res, next) {
        try {
            const { id } = req.params;
            const { skinIds } = req.body;

            if (!Array.isArray(skinIds)) {
                throw new CustomError('skinIds debe ser un array de IDs', 400);
            }

            // Validar que todos los IDs sean válidos
            const areValidIds = skinIds.every(skinId => 
                mongoose.Types.ObjectId.isValid(skinId)
            );

            if (!areValidIds) {
                throw new CustomError('Algunos IDs de skins no son válidos', 400);
            }

            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                { $addToSet: { skins: { $each: skinIds } } }, // $addToSet evita duplicados
                { new: true, runValidators: true }
            )
            .populate('priceRP')
            .populate('skins');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json(updatedUnranked);
        } catch (error) {
            next(error);
        }
    },

    // Eliminar skins de una cuenta unranked
    async removeSkinsFromUnranked(req, res, next) {
        try {
            const { id } = req.params;
            const { skinIds } = req.body;

            if (!Array.isArray(skinIds)) {
                throw new CustomError('skinIds debe ser un array de IDs', 400);
            }

            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                { $pullAll: { skins: skinIds } },
                { new: true, runValidators: true }
            )
            .populate('priceRP')
            .populate('skins');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json(updatedUnranked);
        } catch (error) {
            next(error);
        }
    },

    // Establecer las skins de una cuenta unranked (reemplazar todas)
    async setSkinsForUnranked(req, res, next) {
        try {
            const { id } = req.params;
            const { skinIds } = req.body;

            if (!Array.isArray(skinIds)) {
                throw new CustomError('skinIds debe ser un array de IDs', 400);
            }

            // Validar que todos los IDs sean válidos
            const validSkinIds = skinIds.filter(skinId => mongoose.Types.ObjectId.isValid(skinId));

            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                { skins: validSkinIds }, // Reemplazar completamente el array de skins
                { new: true, runValidators: true }
            )
            .populate('priceRP')
            .populate('skins');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json(updatedUnranked);
        } catch (error) {
            next(error);
        }
    },

    // Actualizar stock de una cuenta unranked
    async updateStockUnranked(req, res, next) {
        try {
            console.error('UNRANKED - Iniciando actualización de stock');
            const { id } = req.params;
            const { quantity } = req.body;
            console.error(`UNRANKED - ID de la cuenta: ${id}, Cantidad: ${quantity}`);
            
            // Validar que quantity sea un número
            if (isNaN(quantity)) {
                console.error('UNRANKED - Error: La cantidad no es un número válido');
                throw new CustomError('La cantidad debe ser un número', 400);
            }
            
            // Convertir a entero
            const stockChange = parseInt(quantity);
            console.error(`UNRANKED - Cambio de stock a realizar: ${stockChange}`);
            
            // Buscar la cuenta actual para obtener el stock actual
            console.error(`UNRANKED - Buscando cuenta con ID: ${id}`);
            const currentUnranked = await Unrankeds.findById(id);
            if (!currentUnranked) {
                console.error(`UNRANKED - Error: Cuenta ${id} no encontrada`);
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }
            console.error(`UNRANKED - Cuenta encontrada: ${currentUnranked.titulo}`);
            console.error(`UNRANKED - Stock actual: ${currentUnranked.stock}, Activa: ${currentUnranked.active}`);
            
            // Calcular el nuevo stock
            let newStock = currentUnranked.stock + stockChange;
            console.error(`UNRANKED - Nuevo stock calculado: ${currentUnranked.stock} + ${stockChange} = ${newStock}`);
            
            // No permitir stocks negativos
            if (newStock < 0) {
                console.error(`UNRANKED - Error: El stock resultante sería negativo (${newStock})`);
                throw new CustomError('El stock no puede ser negativo', 400);
            }
            
            // Si el stock llega a 0, desactivar la cuenta
            const updateData = { stock: newStock };
            if (newStock === 0) {
                updateData.active = false;
                console.error(`UNRANKED - Stock llegó a 0, desactivando cuenta ${id}`);
            }
            
            // Actualizar el stock (y posiblemente el estado active)
            console.error(`UNRANKED - Actualizando en la base de datos: ${JSON.stringify(updateData)}`);
            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            )
            .populate('priceRP')
            .populate('skins');
            
            console.error(`UNRANKED - Stock actualizado para cuenta ${id}: ${currentUnranked.stock} -> ${newStock}`);
            console.error(`UNRANKED - Nuevo estado: Stock=${updatedUnranked.stock}, Activa=${updatedUnranked.active}`);
            
            res.status(200).json({
                message: `Stock actualizado correctamente`,
                unranked: updatedUnranked
            });
        } catch (error) {
            console.error("UNRANKED - Error actualizando stock:", error);
            next(error);
        }
    }
};

module.exports = {
    unrankedsController,
    upload
};
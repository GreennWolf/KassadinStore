const Item = require('../database/Models/itemsModel');
const RPPrice = require('../database/Models/rpPrice');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;
const mongoose = require('mongoose');
const { CustomError } = require('../middlewares/errorHandler');

const ITEMS_DIRECTORY = 'public/items';

if (!fs.existsSync(ITEMS_DIRECTORY)) {
    fs.mkdirSync(ITEMS_DIRECTORY, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, ITEMS_DIRECTORY),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const itemName = req.body.name || 'item';
        const extension = path.extname(file.originalname);
        cb(null, `${itemName}-${timestamp}${extension}`);
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

async function createItem(req, res, next) {
    try {
        const { name, type, priceRP, srcWeb ,skin,reward} = req.body;

        if (!name || !type || !priceRP) {
            throw new CustomError('Faltan campos requeridos', 400, ['name', 'type', 'priceRP']);
        }

        const validTypes = ['loot', 'icon', 'chromas', 'presale', 'tft', 'bundle','unrankeds'];
        if (!validTypes.includes(type)) {
            throw new CustomError('Tipo de item no válido', 400);
        }

        const itemData = {
            name: name.trim(),
            type,
            priceRP,
            srcWeb: srcWeb?.trim() || '',
            reward,
            ...(type === 'chromas' && skin && { skin: skin }),
            ...(req.file && { srcLocal: req.file.filename })
        };

        const newItem = new Item(itemData);
        await newItem.save();

        const populatedItem = await Item.findById(newItem._id)
            .populate('priceRP')
            .populate('skin');
        
        res.status(201).json(populatedItem);
    } catch (error) {
        next(error);
    }
}

async function editItem(req, res, next) {
    try {
        const { id } = req.params;
        const { name, type, priceRP, srcWeb, skin,reward } = req.body;

        const validTypes = ['loot', 'icon', 'chromas', 'presale', 'tft', 'bundle'];
        if (!validTypes.includes(type)) {
            throw new CustomError('Tipo de item no válido', 400);
        }

        const updateData = {
            name: name.trim(),
            type,
            priceRP,
            srcWeb: srcWeb?.trim() || '',
            skin: type === 'chromas' && skin ? skin : null,
            reward,
        };

        if (req.file) {
            const currentItem = await Item.findById(id);
            if (currentItem?.srcLocal) {
                const oldImagePath = path.join(ITEMS_DIRECTORY, currentItem.srcLocal);
                await fsPromises.unlink(oldImagePath).catch(console.warn);
            }
            updateData.srcLocal = req.file.filename;
        }

        const updatedItem = await Item.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
        .populate('priceRP')
        .populate('skin');

        if (!updatedItem) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        res.status(200).json(updatedItem);
    } catch (error) {
        next(error);
    }
}

async function deleteItem(req, res, next) {
    try {
        const { id } = req.params;
        const item = await Item.findById(id);
        
        if (!item) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        await Item.findByIdAndUpdate(
            id,
            { active: false },
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Artículo eliminado correctamente' });
    } catch (error) {
        next(error);
    }
}

async function activeItem(req, res, next) {
    try {
        const { id } = req.params;
        const item = await Item.findById(id);
        
        if (!item) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        await Item.findByIdAndUpdate(
            id,
            { active: true },
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Artículo activado correctamente' });
    } catch (error) {
        next(error);
    }
}



async function getAllItems(req, res, next) {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const search = req.query.search || '';
        const type = req.query.type;
        const showAll = req.query.showAll === 'true'; // Nuevo parámetro
        const skip = (page - 1) * limit;
        const reward = req.query.reward === 'true'; // Nuevo parámetro

        let query = {};
        
        // Solo aplicar filtro de activos si no queremos ver todos
        if (!showAll) {
            query.active = true;
        }

        // Aplicar filtro de reward si está especificado
        if (reward) {
            query.reward = true;
        }

        // Añadir búsqueda si existe
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }

        // Filtrar por tipo si se especifica
        if (type && type !== 'all') {
            query.type = type;
        }

        const [items, total] = await Promise.all([
            Item.find(query)
                .populate('priceRP')
                .populate({
                    path: 'skin',
                    populate: { path: 'champion' }
                })
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit),
            Item.countDocuments(query)
        ]);

        res.json({
            data: items,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + items.length < total
        });
    } catch (error) {
        next(error);
    }
}

async function createRPPrice(req, res, next) {
    try {
        const { valueRP } = req.body;

        if (!valueRP) {
            throw new CustomError('El valor de RP es requerido', 400);
        }

        const existingPrice = await RPPrice.findOne({ valueRP });
        if (existingPrice) {
            throw new CustomError('Ya existe un precio con ese valor de RP', 409);
        }

        const newRPPrice = new RPPrice({ valueRP });
        await newRPPrice.save();
        res.status(201).json(newRPPrice);
    } catch (error) {
        next(error);
    }
}

async function getAllRPPrices(req, res, next) {
    try {
        const rpPrices = await RPPrice.find().sort({ valueRP: 1 });
        res.status(200).json(rpPrices);
    } catch (error) {
        next(error);
    }
}

async function getItemsByType(req, res, next) {
    try {
        const { type } = req.params;
        const validTypes = ['loot', 'icon', 'chromas', 'presale', 'tft', 'bundle'];
        
        if (!validTypes.includes(type)) {
            throw new CustomError('Tipo de item no válido', 400);
        }

        const items = await Item.find({ type })
            .populate('priceRP')
            .populate('skin');

        res.status(200).json(items);
    } catch (error) {
        next(error);
    }
}

async function getItemById(req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new CustomError('ID de item no válido', 400);
        }

        const item = await Item.findById(id)
            .populate('priceRP')
            .populate('skin');

        if (!item) {
            throw new CustomError('Item no encontrado', 404);
        }

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
}

async function deleteRPprice(req, res, next) {
    try {
        const { id } = req.params;
        const rp = await RPPrice.findById(id);
        
        if (!rp) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        await RPPrice.findByIdAndUpdate(
            id,
            { active: false },
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Artículo eliminado correctamente' });
    } catch (error) {
        next(error);
    }
}

async function activeRPprice(req, res, next) {
    try {
        const { id } = req.params;
        const rp = await RPPrice.findById(id);
        
        if (!rp) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        await RPPrice.findByIdAndUpdate(
            id,
            { active: true },
            { new: true, runValidators: true }
        );
        res.status(200).json({ message: 'Artículo activado correctamente' });
    } catch (error) {
        next(error);
    }
}

async function updateRPPrice(req, res, next) {
    try {
        const { id } = req.params;
        const { valueRP, active } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new CustomError('ID de precio de RP no válido', 400);
        }

        const rpPrice = await RPPrice.findById(id);
        if (!rpPrice) {
            throw new CustomError('Precio de RP no encontrado', 404);
        }

        if (valueRP) {
            // Verificar si ya existe otro precio con el mismo valor
            const existingPrice = await RPPrice.findOne({ 
                valueRP, 
                _id: { $ne: id } // Excluir el precio actual de la búsqueda
            });
            
            if (existingPrice) {
                throw new CustomError('Ya existe un precio con ese valor de RP', 409);
            }
        }

        const updateData = {
            ...(valueRP && { valueRP }),
            ...(active !== undefined && { active })
        };

        const updatedRPPrice = await RPPrice.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedRPPrice);
    } catch (error) {
        next(error);
    }
}


// Añadir estas funciones al final de itemsController.js

async function getAllDestacados(req, res, next) {
    try {
        const destacadoItems = await Item.find({ destacado: true })
            .populate('priceRP')
            .populate({
                path: 'skin',
                populate: { path: 'champion' }
            });
        
        res.status(200).json(destacadoItems);
    } catch (error) {
        next(error);
    }
}

async function toggleDestacado(req, res, next) {
    try {
        const { id } = req.params;
        const item = await Item.findById(id);
        
        if (!item) {
            throw new CustomError('Artículo no encontrado', 404);
        }

        // Cambiar el valor de destacado (toggle)
        const nuevoEstadoDestacado = !item.destacado;
        
        await Item.findByIdAndUpdate(
            id,
            { destacado: nuevoEstadoDestacado },
            { new: true, runValidators: true }
        );
        
        res.status(200).json({ 
            message: nuevoEstadoDestacado ? 
                'Artículo marcado como destacado correctamente' : 
                'Artículo desmarcado como destacado correctamente',
            destacado: nuevoEstadoDestacado
        });
    } catch (error) {
        next(error);
    }
}

// Y asegúrate de incluirlas en el exports al final del archivo
module.exports = {
    createItem,
    getAllItems,
    editItem,
    deleteItem,
    createRPPrice,
    getAllRPPrices,
    getItemsByType,
    getItemById,
    updateRPPrice,
    deleteRPprice,
    activeItem,
    activeRPprice,
    getAllDestacados,
    toggleDestacado,
    upload
};
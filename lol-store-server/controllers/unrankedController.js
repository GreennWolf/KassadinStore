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
            const { 
                titulo, 
                priceRP, 
                srcWeb, 
                escencia, 
                nivel, 
                rpAmount, 
                region,
                handUpgrade ,
                escenciaNaranja
            } = req.body;

            // Validación de campos requeridos
            if (!titulo || !priceRP || !nivel || !rpAmount || !region || !escenciaNaranja) {
                throw new CustomError('Faltan campos requeridos', 400);
            }

            const unrankedData = {
                titulo: titulo.trim(),
                priceRP,
                srcWeb: srcWeb?.trim() || '',
                escencia: escencia || 0,
                nivel,
                rpAmount,
                region,
                escenciaNaranja,
                handUpgrade: handUpgrade === 'false' ? false : true,
                ...(req.file && { srcLocal: req.file.filename })
            };

            const newUnranked = new Unrankeds(unrankedData);
            await newUnranked.save();

            const populatedUnranked = await Unrankeds.findById(newUnranked._id)
                .populate('priceRP');
            
            res.status(201).json(populatedUnranked);
        } catch (error) {
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
                region,
                minLevel,
                maxLevel,
                minRP,
                maxRP,
                showAll = false
            } = req.query;

            const skip = (page - 1) * limit;
            let query = {};
            
            if (!showAll) {
                query.active = true;
            }

            if (search) {
                query.titulo = { $regex: search, $options: 'i' };
            }

            if (region) {
                query.region = region;
            }

            if (minLevel || maxLevel) {
                query.nivel = {};
                if (minLevel) query.nivel.$gte = parseInt(minLevel);
                if (maxLevel) query.nivel.$lte = parseInt(maxLevel);
            }

            if (minRP || maxRP) {
                query.rpAmount = {};
                if (minRP) query.rpAmount.$gte = parseInt(minRP);
                if (maxRP) query.rpAmount.$lte = parseInt(maxRP);
            }

            const [unrankeds, total] = await Promise.all([
                Unrankeds.find(query)
                    .populate('priceRP')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(parseInt(limit)),
                Unrankeds.countDocuments(query)
            ]);

            res.json({
                data: unrankeds,
                total,
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                hasMore: skip + unrankeds.length < total
            });
        } catch (error) {
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
                .populate('priceRP');

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
            const { id } = req.params;
            const updateData = { ...req.body };

            // Manejar la imagen si se proporciona una nueva
            if (req.file) {
                const currentUnranked = await Unrankeds.findById(id);
                if (currentUnranked?.srcLocal) {
                    const oldImagePath = path.join(UNRANKEDS_DIRECTORY, currentUnranked.srcLocal);
                    await fsPromises.unlink(oldImagePath).catch(console.warn);
                }
                updateData.srcLocal = req.file.filename;
            }

            const updatedUnranked = await Unrankeds.findByIdAndUpdate(
                id,
                updateData,
                { new: true, runValidators: true }
            ).populate('priceRP');

            if (!updatedUnranked) {
                throw new CustomError('Cuenta unranked no encontrada', 404);
            }

            res.status(200).json(updatedUnranked);
        } catch (error) {
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
            );

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
            );

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
    }
};

module.exports = {
    unrankedsController,
    upload
};
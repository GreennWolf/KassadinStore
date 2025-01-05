const Lootbox = require('../database/Models/lootboxModel');
const LootboxPurchase = require('../database/Models/lootboxPurchaseModel');
const Inventory = require('../database/Models/inventoryModel');
const User = require('../database/Models/userModel');
const { CustomError } = require('../middlewares/errorHandler');
const mongoose = require('mongoose');

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

const LOOTBOX_DIRECTORY = 'public/lootbox';

// Asegurar que el directorio existe
if (!fs.existsSync(LOOTBOX_DIRECTORY)) {
    fs.mkdirSync(LOOTBOX_DIRECTORY, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, LOOTBOX_DIRECTORY),
    filename: (req, file, cb) => {
        const timestamp = Date.now();
        const lootboxName = req.body.name || 'lootbox';
        const extension = path.extname(file.originalname);
        cb(null, `${lootboxName}-${timestamp}${extension}`);
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

const lootboxController = {
    // Crear una nueva lootbox
    createLootbox: async (req, res, next) => {
        try {
            const {
                name,
                description,
                price,
                items,
                purchaseLimit,
                minimumRank,
                endDate
            } = req.body;

            console.log(req.body)

            // Validar dropRates
            const parsedItems = JSON.parse(items);
            const totalDropRate = parsedItems.reduce((sum, item) => sum + item.dropRate, 0);
            if (totalDropRate !== 100) {
                throw new CustomError('La suma de las probabilidades debe ser 100%', 400);
            }

            const lootboxData = {
                name,
                description,
                price,
                items: parsedItems,
                purchaseLimit: purchaseLimit || null,
                minimumRank: minimumRank || null,
                endDate: endDate || null,
                image: req.file ? req.file.filename : null
            };

            const lootbox = new Lootbox(lootboxData);
            await lootbox.save();

            const populatedLootbox = await Lootbox.findById(lootbox._id)
                .populate('items.itemId')
                .populate('minimumRank');

            res.status(201).json(populatedLootbox);
        } catch (error) {
            if (req.file) {
                await fsPromises.unlink(path.join(LOOTBOX_DIRECTORY, req.file.filename))
                    .catch(console.warn);
            }
            next(error);
        }
    },

    updateLootbox: async (req, res, next) => {
        try {
            const { id } = req.params;
            const updates = { ...req.body };

            if (updates.items) {
                updates.items = JSON.parse(updates.items);
                const totalDropRate = updates.items.reduce((sum, item) => sum + item.dropRate, 0);
                if (totalDropRate !== 100) {
                    throw new CustomError('La suma de las probabilidades debe ser 100%', 400);
                }
            }

            // Manejar la imagen si se proporciona una nueva
            if (req.file) {
                const currentLootbox = await Lootbox.findById(id);
                if (currentLootbox?.srcLocal) {
                    const oldImagePath = path.join(LOOTBOX_DIRECTORY, currentLootbox.srcLocal);
                    await fsPromises.unlink(oldImagePath).catch(console.warn);
                }
                updates.srcLocal = req.file.filename;
            }

            const updatedLootbox = await Lootbox.findByIdAndUpdate(
                id,
                updates,
                { new: true, runValidators: true }
            ).populate('items.itemId').populate('minimumRank');

            if (!updatedLootbox) {
                throw new CustomError('Lootbox no encontrada', 404);
            }

            res.json(updatedLootbox);
        } catch (error) {
            if (req.file) {
                await fsPromises.unlink(path.join(LOOTBOX_DIRECTORY, req.file.filename))
                    .catch(console.warn);
            }
            next(error);
        }
    },

    // Obtener todas las lootboxes (con filtro de activas/inactivas)
    getAllLootboxes: async (req, res, next) => {
        try {
            const { active } = req.query;
            const filter = active !== undefined ? { active: active === 'true' } : {};
            
            const lootboxes = await Lootbox.find(filter)
                .populate({
                    path: 'items.itemId',
                    // Populate diferente según el itemType
                    transform: (doc, id) => {
                        console.log('Populating:', doc, id); // Para debugging
                        return doc;
                    }
                })
                .populate('minimumRank');
            
            // Asegurémonos de que los items estén correctamente populados
            const populatedLootboxes = await Promise.all(lootboxes.map(async (lootbox) => {
                const populatedItems = await Promise.all(lootbox.items.map(async (item) => {
                    let populatedItem;
                    if (item.itemType === 'Skin') {
                        populatedItem = await mongoose.model('Skin').findById(item.itemId);
                    } else if (item.itemType === 'Item') {
                        populatedItem = await mongoose.model('Item').findById(item.itemId);
                    }
                    return {
                        ...item.toObject(),
                        itemId: populatedItem
                    };
                }));
                
                const lootboxObj = lootbox.toObject();
                return {
                    ...lootboxObj,
                    items: populatedItems
                };
            }));
            
            res.json(populatedLootboxes);
        } catch (error) {
            next(error);
        }
    },

    // Obtener lootboxes disponibles para un usuario específico
    getAvailableLootboxes: async (req, res, next) => {
        try {
            const { userId } = req.params;
            const user = await User.findById(userId).populate('rank');
            
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            const now = new Date();
            
            // Obtener lootboxes activas y válidas
            const lootboxes = await Lootbox.find({
                active: true,
                $or: [
                    { endDate: null },
                    { endDate: { $gt: now } }
                ]
            }).populate('items.itemId').populate('minimumRank');

            // Filtrar por rango mínimo y límite de compras
            const availableLootboxes = await Promise.all(lootboxes.map(async (lootbox) => {
                // Verificar rango mínimo
                if (lootbox.minimumRank && user.rank.level < lootbox.minimumRank.level) {
                    return null;
                }

                // Verificar límite de compras si existe
                if (lootbox.purchaseLimit) {
                    const purchaseCount = await LootboxPurchase.countDocuments({
                        userId,
                        lootboxId: lootbox._id
                    });

                    if (purchaseCount >= lootbox.purchaseLimit) {
                        return null;
                    }
                }

                return lootbox;
            }));

            res.json(availableLootboxes.filter(Boolean));
        } catch (error) {
            next(error);
        }
    },

    // Obtener una lootbox específica
    getLootboxById: async (req, res, next) => {
        try {
            const lootbox = await Lootbox.findById(req.params.id)
                .populate('items.itemId')
                .populate('minimumRank');

            if (!lootbox) {
                throw new CustomError('Lootbox no encontrada', 404);
            }

            res.json(lootbox);
        } catch (error) {
            next(error);
        }
    },

    // Desactivar una lootbox
    deactivateLootbox: async (req, res, next) => {
        try {
            const { id } = req.params;
            
            const lootbox = await Lootbox.findByIdAndUpdate(
                id,
                { active: false },
                { new: true }
            );

            if (!lootbox) {
                throw new CustomError('Lootbox no encontrada', 404);
            }

            res.json({ message: 'Lootbox desactivada exitosamente', lootbox });
        } catch (error) {
            next(error);
        }
    },

    // Abrir una lootbox
    openLootbox: async (req, res, next) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const { userId } = req.body;
            const { lootboxId } = req.params;

            // Obtener lootbox y validar
            const lootbox = await Lootbox.findById(lootboxId);
            if (!lootbox || !lootbox.active) {
                throw new CustomError('Lootbox no disponible', 400);
            }

            // Verificar usuario y saldo
            const user = await User.findById(userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            if (user.gold < lootbox.price) {
                throw new CustomError('Oro insuficiente', 400);
            }

            // Verificar límite de compras
            if (lootbox.purchaseLimit) {
                const purchaseCount = await LootboxPurchase.countDocuments({
                    userId,
                    lootboxId
                });

                if (purchaseCount >= lootbox.purchaseLimit) {
                    throw new CustomError('Has alcanzado el límite de compras para esta lootbox', 400);
                }
            }

            // Verificar rango mínimo
            if (lootbox.minimumRank) {
                await user.populate('rank');
                if (user.rank.level < lootbox.minimumRank.level) {
                    throw new CustomError('No cumples con el rango mínimo requerido', 400);
                }
            }

            // Obtener inventario o crearlo
            let inventory = await Inventory.findOne({ userId });
            if (!inventory) {
                inventory = new Inventory({ userId });
            }

            // Obtener item aleatorio
            const wonItem = lootbox.rollItem();

            // Crear registro de compra
            const purchase = new LootboxPurchase({
                userId,
                lootboxId,
                itemReceived: {
                    itemType: wonItem.itemType,
                    itemId: wonItem.itemId,
                    quantity: wonItem.quantity
                },
                goldSpent: lootbox.price
            });

            // Actualizar inventario
            await inventory.addItem({
                itemType: wonItem.itemType,
                itemId: wonItem.itemId,
                quantity: wonItem.quantity,
                obtainedFrom: 'Lootbox'
            });

            // Descontar oro
            user.gold -= lootbox.price;

            // Guardar todos los cambios
            await purchase.save({ session });
            await inventory.save({ session });
            await user.save({ session });

            await session.commitTransaction();

            // Poblar la respuesta
            await purchase.populate('itemReceived.itemId');

            res.json({
                message: '¡Lootbox abierta exitosamente!',
                itemReceived: purchase.itemReceived,
                remainingGold: user.gold
            });

        } catch (error) {
            await session.abortTransaction();
            next(error);
        } finally {
            session.endSession();
        }
    },

    // Obtener historial de aperturas de un usuario
    getUserLootboxHistory: async (req, res, next) => {
        try {
            const { userId } = req.params;
            
            const history = await LootboxPurchase.find({ userId })
                .populate('lootboxId')
                .populate('itemReceived.itemId')
                .sort({ purchaseDate: -1 });

            res.json(history);
        } catch (error) {
            next(error);
        }
    }
};

module.exports = {...lootboxController,upload};
const Inventory = require('../database/Models/inventoryModel');
const User = require('../database/Models/userModel');
const Item = require('../database/Models/itemsModel');
const Skin = require('../database/Models/skinModel');
const GoldConvertion = require('../database/Models/goldConvertionModel');
const { CustomError } = require('../middlewares/errorHandler');


const inventoryController = {
    // Obtener los items activos del inventario
    async getActiveItems(req, res, next) {
        try {
            const { userId } = req.params;
            
            let inventory = await Inventory.findOne({ userId })
                .populate({
                    path: 'activeItems.itemId',
                    refPath: 'activeItems.itemType',
                    select: '-__v' // Excluir campo de versión
                })
                .select('activeItems lastUpdated')
                .lean();

            if (!inventory) {
                inventory = await Inventory.create({ 
                    userId,
                    activeItems: [],
                    usedItems: [],
                    lastUpdated: new Date()
                });
            }

            res.status(200).json({
                items: inventory.activeItems || [],
                lastUpdated: inventory.lastUpdated
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener los items usados del inventario
    async getUsedItems(req, res, next) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20 } = req.query;
            
            let inventory = await Inventory.findOne({ userId })
                .populate({
                    path: 'usedItems.itemId',
                    refPath: 'usedItems.itemType',
                    select: '-__v'
                })
                .select('usedItems')
                .lean();

            if (!inventory) {
                inventory = await Inventory.create({ 
                    userId,
                    activeItems: [],
                    usedItems: [],
                    lastUpdated: new Date()
                });
            }

            const sortedItems = inventory.usedItems ? inventory.usedItems.sort((a, b) => 
                new Date(b.usedAt) - new Date(a.usedAt)
            ) : [];

            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedItems = sortedItems.slice(startIndex, endIndex);

            res.status(200).json({
                items: paginatedItems,
                totalItems: sortedItems.length,
                currentPage: parseInt(page),
                totalPages: Math.ceil(sortedItems.length / limit),
                hasMore: endIndex < sortedItems.length
            });
        } catch (error) {
            next(error);
        }
    },

    // Obtener el historial completo
    async getFullHistory(req, res, next) {
        try {
            const { userId } = req.params;
            const { page = 1, limit = 20, type } = req.query;
            
            let inventory = await Inventory.findOne({ userId })
                .populate({
                    path: 'activeItems.itemId',
                    refPath: 'activeItems.itemType',
                    select: '-__v'
                })
                .populate({
                    path: 'usedItems.itemId',
                    refPath: 'usedItems.itemType',
                    select: '-__v'
                })
                .lean();

            if (!inventory) {
                inventory = await Inventory.create({ 
                    userId,
                    activeItems: [],
                    usedItems: [],
                    lastUpdated: new Date()
                });
            }

            let history = (inventory.activeItems || []).concat(inventory.usedItems || [])
                .sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt));

            if (type) {
                history = history.filter(item => item.itemType.toLowerCase() === type.toLowerCase());
            }

            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const paginatedItems = history.slice(startIndex, endIndex);

            res.status(200).json({
                items: paginatedItems,
                totalItems: history.length,
                currentPage: parseInt(page),
                totalPages: Math.ceil(history.length / limit),
                hasMore: endIndex < history.length
            });
        } catch (error) {
            next(error);
        }
    },

    // Comprar y agregar item al inventario
    async purchaseItem(req, res, next) {
        try {
            const { userId, itemType, itemId, quantity = 1 } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            // Convertir el tipo de item al formato correcto para el modelo
            const modelType = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            const Model = modelType === 'Skin' ? Skin : Item;

            const item = await Model.findById(itemId).populate('priceRP');
            if (!item) {
                throw new CustomError('Item no encontrado', 404);
            }

            if (!item.priceRP) {
                throw new CustomError('El item no tiene un precio definido', 400);
            }

            // Obtener la conversión de oro
            const goldConversion = await GoldConvertion.findOne({ 
                rpPrice: item.priceRP._id 
            });

            if (!goldConversion) {
                throw new CustomError('No existe una conversión de oro para este item', 400);
            }

            const totalCost = goldConversion.gold * quantity;

            if (user.gold < totalCost) {
                throw new CustomError('Oro insuficiente para realizar la compra', 400);
            }

            let inventory = await Inventory.findOne({ userId });
            if (!inventory) {
                inventory = new Inventory({ userId });
            }

            // Restar oro al usuario
            user.gold -= totalCost;
            await user.save();

            // Agregar item al inventario
            await inventory.addItem({
                itemType: modelType,
                itemId: item._id,
                quantity,
                obtainedFrom: 'purchase',
                goldSpent: totalCost
            });

            // Obtener inventario actualizado con los items populados
            const updatedInventory = await Inventory.findById(inventory._id)
                .populate({
                    path: 'activeItems.itemId',
                    refPath: 'activeItems.itemType',
                    select: '-__v'
                })
                .lean();

            res.status(200).json({
                message: 'Compra realizada exitosamente',
                inventory: updatedInventory,
                remainingGold: user.gold
            });
        } catch (error) {
            next(error);
        }
    },

    // Usar un item del inventario
    async useItem(req, res, next) {
        try {
            const { userId, itemId, quantity = 1 } = req.body;

            let inventory = await Inventory.findOne({ userId });
            if (!inventory) {
                inventory = await Inventory.create({ 
                    userId,
                    activeItems: [],
                    usedItems: [],
                    lastUpdated: new Date()
                });
            }

            await inventory.useItem(itemId, quantity);

            const updatedInventory = await Inventory.findById(inventory._id)
                .populate({
                    path: 'activeItems.itemId',
                    refPath: 'activeItems.itemType',
                    select: '-__v'
                })
                .populate({
                    path: 'usedItems.itemId',
                    refPath: 'usedItems.itemType',
                    select: '-__v'
                })
                .lean();

            res.status(200).json({
                message: 'Item utilizado exitosamente',
                inventory: updatedInventory
            });
        } catch (error) {
            next(error);
        }
    },

    // Verificar si se puede comprar un item
    async canPurchaseItem(req, res, next) {
        try {
            const { userId, itemType, itemId, quantity = 1 } = req.body;

            const user = await User.findById(userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            const modelType = itemType.charAt(0).toUpperCase() + itemType.slice(1);
            const Model = modelType === 'Skin' ? Skin : Item;

            const item = await Model.findById(itemId).populate('priceRP');
            if (!item) {
                throw new CustomError('Item no encontrado', 404);
            }

            if (!item.priceRP) {
                throw new CustomError('El item no tiene un precio definido', 400);
            }

            const goldConversion = await GoldConvertion.findOne({ 
                rpPrice: item.priceRP._id 
            });

            if (!goldConversion) {
                throw new CustomError('No existe una conversión de oro para este item', 400);
            }

            const totalCost = goldConversion.gold * quantity;

            res.status(200).json({
                canPurchase: user.gold >= totalCost,
                totalCost,
                userGold: user.gold,
                missingGold: Math.max(0, totalCost - user.gold)
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = inventoryController;
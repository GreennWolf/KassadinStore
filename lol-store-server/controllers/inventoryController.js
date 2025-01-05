// controllers/inventoryController.js
const Inventory = require('../models/inventoryModel');
const { CustomError } = require('../middlewares/errorHandler');

const inventoryController = {
    async addItem(req, res, next) {
        try {
            const { userId, itemType, itemId, quantity, obtainedFrom } = req.body;

            let inventory = await Inventory.findOne({ userId });
            
            // Si no existe el inventario, créalo
            if (!inventory) {
                inventory = new Inventory({ userId });
            }

            // Usar el método addItem del modelo
            await inventory.addItem({
                itemType,
                itemId,
                quantity,
                obtainedFrom
            });

            return res.status(200).json({
                message: 'Item agregado al inventario exitosamente',
                inventory
            });

        } catch (error) {
            next(error);
        }
    },

    async removeItem(req, res, next) {
        try {
            const { userId, itemId } = req.body;

            const inventory = await Inventory.findOne({ userId });
            if (!inventory) {
                throw new CustomError('Inventario no encontrado', 404);
            }

            // Encuentra y elimina el item del array de items
            const itemIndex = inventory.items.findIndex(
                item => item._id.toString() === itemId
            );

            if (itemIndex === -1) {
                throw new CustomError('Item no encontrado en el inventario', 404);
            }

            inventory.items.splice(itemIndex, 1);
            inventory.lastUpdated = new Date();
            await inventory.save();

            return res.status(200).json({
                message: 'Item eliminado exitosamente',
                inventory
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = inventoryController;
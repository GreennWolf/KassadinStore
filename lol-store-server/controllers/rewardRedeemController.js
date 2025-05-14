const RewardsRedeem = require('../database/Models/rewardsRedeemModel');
const Status = require('../database/Models/statusModel');
const Skin = require('../database/Models/skinModel');
const Item = require('../database/Models/itemsModel');
const Unranked = require('../database/Models/unrankedModel');
const Inventory = require('../database/Models/inventoryModel');
const { CustomError } = require('../middlewares/errorHandler');

// Función auxiliar para validar items y verificar inventario
async function validateItemsAndInventory(items, userId) {
  const inventory = await Inventory.findOne({ userId })
    .populate({
      path: 'activeItems.itemId',
      refPath: 'activeItems.itemType'
    });

  if (!inventory) {
    throw new CustomError('Inventario no encontrado', 404);
  }

  // Parsear items si viene como string
  const itemsArray = typeof items === 'string' ? JSON.parse(items) : items;

  const validatedItems = [];
  for (const item of itemsArray) {
    // Buscar en el inventario
    const inventoryItem = inventory.activeItems.find(
      activeItem => 
        activeItem.itemId._id.toString() === item._id &&  // Cambiado para coincidir con el formato
        activeItem.itemType === item.itemType &&
        !activeItem.claimed
    );

    if (!inventoryItem) {
      throw new CustomError(`Item ${item._id} no encontrado en el inventario o ya fue reclamado`, 404);
    }

    validatedItems.push({
      itemId: item._id,
      itemType: item.itemType,
      inventoryItemId: inventoryItem._id
    });
  }

  return { validatedItems, inventory };
}

// Función auxiliar para mover items de activos a usados
async function moveItemsToUsed(inventory, items) {
  for (const item of items) {
    // Obtener la cantidad a usar (por defecto 1)
    const quantityToRedeem = item.quantity || 1;
    
    const itemIndex = inventory.activeItems.findIndex(
      activeItem => activeItem._id.toString() === item.inventoryItemId.toString()
    );

    if (itemIndex !== -1) {
      const activeItem = inventory.activeItems[itemIndex];
      
      // Añadir a los items usados SOLO la cantidad reclamada
      inventory.usedItems.push({
        itemType: activeItem.itemType,
        itemId: activeItem.itemId,
        quantity: quantityToRedeem, // SOLO la cantidad reclamada, no toda
        obtainedFrom: activeItem.obtainedFrom,
        obtainedAt: activeItem.obtainedAt,
        goldSpent: activeItem.goldSpent,
        usedAt: new Date()
      });
      
      // Reducir la cantidad del item en el inventario
      activeItem.quantity -= quantityToRedeem;
      
      // Solo eliminar el item si la cantidad llega a 0
      if (activeItem.quantity <= 0) {
        inventory.activeItems.splice(itemIndex, 1);
      }
    }
  }
  
  await inventory.save();
}

const rewardsRedeemController = {
  createRedeem: async (req, res, next) => {
    try {
      const { userId, items, riotName, discordName, region } = req.body;
      if (!userId || !items || !riotName || !discordName || !region) {
        throw new CustomError('Faltan datos requeridos', 400);
      }

      // Validar items y verificar inventario
      const { validatedItems, inventory } = await validateItemsAndInventory(JSON.parse(items), userId);

      const defaultStatus = await Status.findOne({ default: true });
      if (!defaultStatus) {
        throw new CustomError('No se encontró un status por defecto', 500);
      }

      // Crear el redeem
      const newRedeem = new RewardsRedeem({
        userId,
        items: validatedItems,
        riotName,
        discordName,
        region,
        status: {
          statusId: defaultStatus._id,
          estadoConfirmado: false,
          confirmadoEn: null
        }
      });

      await newRedeem.save();

      // Mover items de activos a usados en el inventario
      await moveItemsToUsed(inventory, validatedItems);

      // Populate el redeem para la respuesta
      await newRedeem.populate([
        {
          path: 'items.itemId',
          refPath: 'items.itemType'
        },
        {
          path: 'status.statusId'
        }
      ]);

      res.status(201).json(newRedeem);
    } catch (error) {
      next(error);
    }
  },

  getAllRedeems: async (req, res, next) => {
    try {
      const redeems = await RewardsRedeem.find()
        .populate('userId')
        .populate('status.statusId')
        .populate({
          path: 'items.itemId',
          refPath: 'items.itemType'
        });
      res.json(redeems);
    } catch (error) {
      next(error);
    }
  },

  getUserRedeems: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const redeems = await RewardsRedeem.find({ userId })
        .populate('status.statusId')
        .populate({
          path: 'items.itemId',
          refPath: 'items.itemType'
        });
      res.json(redeems);
    } catch (error) {
      next(error);
    }
  },

  updateRedeem: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      if (updates.status) {
        const newStatus = await Status.findById(updates.status);
        if (!newStatus) {
          throw new CustomError('Estado no encontrado', 404);
        }

        updates.status = {
          statusId: newStatus._id,
          estadoConfirmado: false,
          confirmadoEn: null
        };
        updates.statusChangedAt = new Date();
        updates.statusChangeViewed = false;
      }

      const updatedRedeem = await RewardsRedeem.findByIdAndUpdate(
        id, 
        updates, 
        { new: true }
      ).populate('status.statusId');

      if (!updatedRedeem) {
        throw new CustomError('Redeem no encontrado', 404);
      }

      res.json(updatedRedeem);
    } catch (error) {
      next(error);
    }
  },

  deleteRedeem: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedRedeem = await RewardsRedeem.findByIdAndDelete(id);
      if (!deletedRedeem) {
        throw new CustomError('Redeem no encontrado', 404);
      }
      res.json({ message: 'Redeem eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  getUnreadRedeems: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const unreadRedeems = await RewardsRedeem.find({
        userId,
        statusChangeViewed: false,
        statusChangedAt: { $ne: null }
      })
        .populate('status.statusId')
        .populate({
          path: 'items.itemId',
          refPath: 'items.itemType'
        })
        .sort({ statusChangedAt: -1 });
      res.json(unreadRedeems);
    } catch (error) {
      next(error);
    }
  },

  markStatusAsViewed: async (req, res, next) => {
    try {
      const { redeemId } = req.params;
      const redeem = await RewardsRedeem.findByIdAndUpdate(
        redeemId,
        { statusChangeViewed: true },
        { new: true }
      );
      if (!redeem) {
        throw new CustomError('Redeem no encontrado', 404);
      }
      res.json(redeem);
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const count = await RewardsRedeem.countDocuments({
        userId,
        statusChangeViewed: false,
        statusChangedAt: { $ne: null }
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  },

  confirmRedeemStatus: async (req, res, next) => {
    try {
      const { redeemId } = req.params;
      const redeem = await RewardsRedeem.findById(redeemId).populate({
        path: 'status.statusId',
        model: 'Status'
      });

      if (!redeem) {
        throw new CustomError('Redeem no encontrado', 404);
      }

      const currentStatus = redeem.status.statusId;
      if (!currentStatus.confirmacion) {
        throw new CustomError('Este estado no requiere confirmación', 400);
      }

      if (redeem.status.estadoConfirmado) {
        throw new CustomError('Este estado ya fue confirmado', 400);
      }

      if (currentStatus.confirmationAction) {
        switch (currentStatus.confirmationAction.type) {
          case 'startTimer': {
            const timerDuration = currentStatus.confirmationAction.config.time;
            redeem.timerEndTime = new Date(Date.now() + timerDuration * 60 * 1000);
            redeem.status.estadoConfirmado = true;
            redeem.status.confirmadoEn = new Date();
            break;
          }
          case 'changeStatus': {
            const newStatusId = currentStatus.confirmationAction.config.targetStatus;
            const newStatus = await Status.findById(newStatusId);
            if (!newStatus) {
              throw new CustomError('Estado objetivo no encontrado', 404);
            }
            redeem.status = {
              statusId: newStatusId,
              estadoConfirmado: false,
              confirmadoEn: null
            };
            redeem.statusChangedAt = new Date();
            redeem.statusChangeViewed = false;
            break;
          }
          default:
            redeem.status.estadoConfirmado = true;
            redeem.status.confirmadoEn = new Date();
        }
      } else {
        redeem.status.estadoConfirmado = true;
        redeem.status.confirmadoEn = new Date();
      }

      await redeem.save();
      await redeem.populate('status.statusId');
      res.json({ message: 'Estado confirmado exitosamente', redeem });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = rewardsRedeemController;
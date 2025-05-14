// controllers/lootboxController.js

const Lootbox = require('../database/Models/lootboxModel');
const LootboxPurchase = require('../database/Models/lootboxPurchaseModel');
const Inventory = require('../database/Models/inventoryModel');
const User = require('../database/Models/userModel');
const RewardCoupon = require('../database/Models/rewardCouponModel');
const RewardCouponPreset = require('../database/Models/rewardCouponPreset');
const FragmentsPreset = require('../database/Models/FragmentsPreset'); // <-- Importante: modelo de fragmentos
const FragmentsUser = require('../database/Models/FragmentsUser'); // <-- Importante: modelo de fragmentos
const { CustomError } = require('../middlewares/errorHandler');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const fsPromises = fs.promises;

// Ruta donde se guardan las imágenes de lootboxes
const LOOTBOX_DIRECTORY = 'public/lootbox';
if (!fs.existsSync(LOOTBOX_DIRECTORY)) {
  fs.mkdirSync(LOOTBOX_DIRECTORY, { recursive: true });
}

// Configuración de multer
const multer = require('multer');
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

// Helper para popular skins e items en la lootbox
async function populateItems(lootbox) {
  const populatedItems = await Promise.all(
    lootbox.items.map(async (item) => {
      // Para Skin o Item, populamos
      if (item.itemType === 'Skin') {
        const skin = await require('mongoose').model('Skin').findById(item.itemId);
        if (skin) {
          return { ...item.toObject(), itemId: skin };
        }
      } else if (item.itemType === 'Item') {
        const dbItem = await require('mongoose').model('Item').findById(item.itemId);
        if (dbItem) {
          return { ...item.toObject(), itemId: dbItem };
        }
      }
      // Para Gold, RewardCouponPreset o FragmentsPreset no hay populado
      return item.toObject();
    })
  );

  const lootboxObj = lootbox.toObject();
  lootboxObj.items = populatedItems;
  return lootboxObj;
}

const lootboxController = {
  // 1. Crear lootbox
  async createLootbox(req, res, next) {
    try {
      const { name, description, price, items, purchaseLimit, minimumRank, endDate, color } = req.body;
      const parsedItems = JSON.parse(items);
      
      // Asignar colores predeterminados a los items según su tipo si no tienen color
      parsedItems.forEach(item => {
        if (!item.color) {
          switch (item.itemType) {
            case 'Skin':
              item.color = '#9C27B0'; // Púrpura para skins
              break;
            case 'Gold':
              item.color = '#FFD700'; // Dorado para oro
              break;
            case 'RewardCouponPreset':
              item.color = '#4CAF50'; // Verde para cupones
              break;
            case 'FragmentsPreset':
              item.color = '#2196F3'; // Azul para fragmentos
              break;
            case 'Item':
            default:
              item.color = '#FF5722'; // Naranja para items generales
          }
        }
      });
  
      // Validar que la suma de probabilidades sea 100
      const totalDropRate = parsedItems.reduce((sum, it) => sum + Number(it.dropRate), 0);
      if (totalDropRate !== 100) {
        throw new CustomError('La suma de las probabilidades debe ser 100%', 400);
      }
  
      const lootboxData = {
        name,
        description,
        price,
        items: parsedItems,
        purchaseLimit: purchaseLimit || null,
        minimumRank: (minimumRank && minimumRank !== 'none') ? minimumRank : null,
        endDate: endDate || null,
        image: req.file ? req.file.filename : null,
        color: color || "#808080"  // Usar el color proporcionado o el predeterminado
      };
  
      const lootbox = await Lootbox.create(lootboxData);
  
      // Poblar para respuesta
      const populatedLootbox = await populateItems(
        await Lootbox.findById(lootbox._id).populate('minimumRank')
      );
      return res.status(201).json(populatedLootbox);
    } catch (error) {
      if (req.file) {
        await fsPromises.unlink(path.join(LOOTBOX_DIRECTORY, req.file.filename)).catch(() => {});
      }
      next(error);
    }
  },

  // 2. Actualizar lootbox
  async updateLootbox(req, res, next) {
    try {
      const { id } = req.params;
      const updates = { ...req.body };
      console.log('Lootbox items =>', JSON.stringify(req.body.items, null, 2));

      if (updates.items) {
        const parsedItems = JSON.parse(updates.items);
        
        // Asignar colores predeterminados a los items según su tipo si no tienen color
        parsedItems.forEach(item => {
          if (!item.color) {
            switch (item.itemType) {
              case 'Skin':
                item.color = '#9C27B0'; // Púrpura para skins
                break;
              case 'Gold':
                item.color = '#FFD700'; // Dorado para oro
                break;
              case 'RewardCouponPreset':
                item.color = '#4CAF50'; // Verde para cupones
                break;
              case 'FragmentsPreset':
                item.color = '#2196F3'; // Azul para fragmentos
                break;
              case 'Item':
              default:
                item.color = '#FF5722'; // Naranja para items generales
            }
          }
        });
        
        const totalDropRate = parsedItems.reduce((sum, it) => sum + Number(it.dropRate), 0);
        if (totalDropRate !== 100) {
          throw new CustomError('La suma de las probabilidades debe ser 100%', 400);
        }
        updates.items = parsedItems;
      }

      // Si hay nueva imagen, eliminar la anterior
      if (req.file) {
        const currentLootbox = await Lootbox.findById(id);
        if (currentLootbox && currentLootbox.image) {
          const oldImagePath = path.join(LOOTBOX_DIRECTORY, currentLootbox.image);
          await fsPromises.unlink(oldImagePath).catch(() => {});
        }
        updates.image = req.file.filename;
      }

      if (updates.minimumRank === 'none') {
        updates.minimumRank = null;
      }

      const updatedLootbox = await Lootbox.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('minimumRank');

      if (!updatedLootbox) {
        throw new CustomError('Lootbox no encontrada', 404);
      }

      const populatedLootbox = await populateItems(updatedLootbox);
      return res.json(populatedLootbox);
    } catch (error) {
      if (req.file) {
        await fsPromises.unlink(path.join(LOOTBOX_DIRECTORY, req.file.filename)).catch(() => {});
      }
      next(error);
    }
  },

  // 3. Obtener todas las lootboxes
  async getAllLootboxes(req, res, next) {
    try {
      const { active } = req.query;
      const filter = {};
      if (typeof active !== 'undefined') {
        filter.active = (active === 'true');
      }
      const lootboxes = await Lootbox.find(filter).populate('minimumRank');
      const populated = await Promise.all(lootboxes.map(lb => populateItems(lb)));
      res.json(populated);
    } catch (error) {
      next(error);
    }
  },

  // 4. Obtener lootboxes disponibles para un usuario
  async getAvailableLootboxes(req, res, next) {
    try {
      const { userId } = req.params;
      const user = await User.findById(userId).populate('rank');
      if (!user) {
        throw new CustomError('Usuario no encontrado', 404);
      }

      const now = new Date();
      const lootboxes = await Lootbox.find({
        active: true,
        $or: [
          { endDate: null },
          { endDate: { $gt: now } }
        ]
      }).populate('minimumRank');

      const available = [];
      for (const lb of lootboxes) {
        // Rango mínimo
        if (lb.minimumRank && user.rank.level < lb.minimumRank.level) {
          continue;
        }
        // Límite de compras
        if (lb.purchaseLimit) {
          const purchaseCount = await LootboxPurchase.countDocuments({
            userId,
            lootboxId: lb._id
          });
          if (purchaseCount >= lb.purchaseLimit) {
            continue;
          }
        }
        available.push(lb);
      }

      const populated = await Promise.all(available.map(lb => populateItems(lb)));
      res.json(populated);
    } catch (error) {
      next(error);
    }
  },

  // 5. Obtener lootbox por ID
  async getLootboxById(req, res, next) {
    try {
      const lootbox = await Lootbox.findById(req.params.id).populate('minimumRank');
      if (!lootbox) {
        throw new CustomError('Lootbox no encontrada', 404);
      }
      const populated = await populateItems(lootbox);
      res.json(populated);
    } catch (error) {
      next(error);
    }
  },

  // 6. Desactivar lootbox
  async deactivateLootbox(req, res, next) {
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

  // 7. Abrir lootbox (actualizado con FragmentsUser y color)
  async openLootbox(req, res, next) {
    try {
      const { userId } = req.body;
      const { lootboxId } = req.params;
  
      // Verificar lootbox
      const lootbox = await Lootbox.findById(lootboxId);
      if (!lootbox || !lootbox.active) {
        throw new CustomError('Lootbox no disponible', 400);
      }
  
      // Verificar usuario y oro
      const user = await User.findById(userId);
      if (!user) {
        throw new CustomError('Usuario no encontrado', 404);
      }
      if (user.gold < lootbox.price) {
        throw new CustomError('Oro insuficiente', 400);
      }
  
      // Límite de compras
      if (lootbox.purchaseLimit) {
        const purchaseCount = await LootboxPurchase.countDocuments({ userId, lootboxId });
        if (purchaseCount >= lootbox.purchaseLimit) {
          throw new CustomError('Has alcanzado el límite de compras para esta lootbox', 400);
        }
      }
  
      // Rango mínimo
      if (lootbox.minimumRank) {
        await user.populate('rank');
        if (user.rank.level < lootbox.minimumRank.level) {
          throw new CustomError('No cumples con el rango mínimo requerido', 400);
        }
      }
  
      // Obtener inventario
      let inventory = await Inventory.findOne({ userId });
      if (!inventory) {
        inventory = new Inventory({ userId });
        await inventory.save();
      }
  
      // Seleccionar el ítem según las probabilidades
      const wonItem = lootbox.rollItem();
  
      // Preparamos la data para el registro de compra
      let purchaseData = {
        userId,
        lootboxId,
        goldSpent: lootbox.price
      };
  
      if (wonItem.itemType === 'Gold') {
        // Si es oro
        const goldAmount = Number(wonItem.itemId);
        purchaseData.itemReceived = {
          itemType: 'Gold',
          itemId: null,
          quantity: wonItem.quantity,
          dropRate: wonItem.dropRate,
          color: wonItem.color, // Incluir el color del item
          details: { amount: goldAmount ,color:wonItem.color}
        };
        user.gold += goldAmount;
  
      } else if (wonItem.itemType === 'RewardCouponPreset') {
        // Si es un RewardCouponPreset
        // Obtener información completa del cupón preset
        const couponPreset = await RewardCouponPreset.findById(wonItem.itemId);
        if (!couponPreset) {
          throw new CustomError('Cupón preset no encontrado', 404);
        }
      
        // Generar un entryId único para esta transacción
        const entryId = uuidv4();
      
        // Crear objeto details con la estructura requerida
        const couponDetails = {
          champion: null, // Los cupones no tienen un campeón asociado
          fullInfo: true,
          name: couponPreset.name || "Cupón de Recompensa",
          obtainedFrom: "reward",
          src: "", // Los cupones no suelen tener una URL externa
          srcLocal: "", // Los cupones no suelen tener una ruta local
          color: wonItem.color // Incluir el color en los detalles
        };
        
        // Agregar detalles adicionales específicos de los cupones
        couponDetails.percent = couponPreset.percent;
        couponDetails.maxUses = couponPreset.maxUses;
        couponDetails.validDays = couponPreset.validDays;
        couponDetails.type = couponPreset.type;
        couponDetails.applicableTo = couponPreset.applicableTo;
        
        // Preparar información para el registro de compra
        purchaseData.itemReceived = {
          itemType: wonItem.itemType,
          itemId: wonItem.itemId,
          dropRate: wonItem.dropRate,
          quantity: wonItem.quantity || 1,
          color: wonItem.color, // Incluir el color del item
          details: couponDetails,
          entryId: entryId
        };
        
        // Agregar entrada al inventario con los mismos detalles
        await inventory.addItem({
          itemType: wonItem.itemType,
          itemId: wonItem.itemId,
          quantity: wonItem.quantity || 1,
          obtainedFrom: 'reward',
          color: wonItem.color, // Incluir el color al agregar al inventario
          details: couponDetails,
          entryId: entryId
        });
  
      } else if (wonItem.itemType === 'FragmentsPreset') {
        // ACTUALIZADO: Manejo de fragmentos con FragmentsUser
        const fragmentPreset = await FragmentsPreset.findById(wonItem.itemId);
        if (!fragmentPreset) {
          throw new CustomError('Fragment preset no encontrado', 404);
        }
  
        // Generamos un entryId único para esta transacción
        const entryId = uuidv4();
        
        // Buscamos si ya existe un registro de este usuario para este fragmento
        let fragmentUser = await FragmentsUser.findOne({
          userId,
          fragmentId: fragmentPreset._id,
          isActive: true
        });
        
        // Si no existe, creamos uno nuevo
        if (!fragmentUser) {
          fragmentUser = new FragmentsUser({
            userId,
            fragmentId: fragmentPreset._id,
            fragmentQuantity: 1,
            entryId,
            color: wonItem.color // Guardar el color en el fragmento
          });
        } else {
          // Si ya existe, incrementamos la cantidad
          fragmentUser.fragmentQuantity += 1;
          fragmentUser.entryId = entryId; // Actualizamos el entryId
          fragmentUser.color = wonItem.color; // Actualizamos el color
        }
        
        // Guardamos el FragmentsUser
        await fragmentUser.save();
        
        // Preparamos la información para el registro de compra
        purchaseData.itemReceived = {
          itemType: 'FragmentsPreset',
          itemId: fragmentPreset._id,
          quantity: 1,
          dropRate: wonItem.dropRate,
          color: wonItem.color, // Incluir el color del item
          details: {
            name: fragmentPreset.name,
            type: fragmentPreset.type,
            rewardType: fragmentPreset.rewardType,
            requiredQuantity: fragmentPreset.requiredQuantity,
            fragmentUserId: fragmentUser._id,
            currentQuantity: fragmentUser.fragmentQuantity,
            color: wonItem.color // Incluir el color en los detalles
          }
        };
        
        // Si el fragmento es de tipo específico, manejamos la lógica adicional
        if (fragmentPreset.type === 'especifico' && fragmentUser.fragmentQuantity >= fragmentPreset.requiredQuantity) {
          // Si ya tiene suficientes fragmentos, podríamos hacer algo especial (opcional)
          purchaseData.itemReceived.details.canClaim = true;
        } else {
          purchaseData.itemReceived.details.canClaim = false;
        }
        
        // Agregamos entrada al inventario que referencia al FragmentsUser
        await inventory.addItem({
          itemType: 'FragmentsUser',
          itemId: fragmentUser._id,
          quantity: 1,
          obtainedFrom: 'reward',
          color: wonItem.color, // Incluir el color al agregar al inventario
          details: {
            fragmentId: fragmentPreset._id,
            fragmentName: fragmentPreset.name,
            fragmentType: fragmentPreset.type,
            fragmentReward:fragmentPreset.rewardType,
            ItemId:fragmentPreset.itemId,
            requiredQuantity: fragmentPreset.requiredQuantity,
            color: wonItem.color, // Incluir el color en los detalles
            entryId
          }
        });
  
      } else if (wonItem.itemType === 'Skin') {
        // Para Skin - ACTUALIZADO para usar la misma estructura que al reclamar fragmentos
        // Obtener la skin completa
        const skin = await require('mongoose').model('Skin').findById(wonItem.itemId).populate('champion');
        
        if (!skin) {
          throw new CustomError('Skin no encontrada', 404);
        }
        
        // Generar un entryId único para esta entrada
        const entryId = uuidv4();
        
        // Crear objeto details con exactamente la misma estructura que en claimFragment
        const skinDetails = {
          champion: skin.champion ? skin.champion._id : null,
          fullInfo: true,
          name: skin.NombreSkin || skin.name || "Skin sin nombre",
          obtainedFrom: "reward",
          src: skin.src || "",
          srcLocal: skin.srcLocal || "",
          color: wonItem.color // Incluir el color en los detalles
        };
        
        // Preparar información para el registro de compra con la estructura correcta
        purchaseData.itemReceived = {
          itemType: 'Skin',
          itemId: skin._id,
          dropRate: wonItem.dropRate,
          quantity: wonItem.quantity || 1,
          color: wonItem.color, // Incluir el color del item
          details: skinDetails,
          entryId: entryId
        };
        
        // Agregar al inventario con la estructura correcta
        await inventory.addItem({
          itemType: 'Skin',
          itemId: skin._id,
          quantity: wonItem.quantity || 1,
          obtainedFrom: 'reward',
          color: wonItem.color, // Incluir el color al agregar al inventario
          details: skinDetails,
          entryId: entryId
        });
      } else {
        // Para otros tipos de items
        purchaseData.itemReceived = {
          itemType: wonItem.itemType,
          itemId: wonItem.itemId,
          dropRate: wonItem.dropRate,
          quantity: wonItem.quantity,
          color: wonItem.color, // Incluir el color del item
          details: {
            ...wonItem.details,
            color: wonItem.color // Asegurarse de que el color esté en los detalles
          }
        };
        await inventory.addItem({
          itemType: wonItem.itemType,
          itemId: wonItem.itemId,
          quantity: wonItem.quantity,
          obtainedFrom: 'reward',
          color: wonItem.color, // Incluir el color al agregar al inventario
          details: {
            ...wonItem.details,
            color: wonItem.color // Asegurarse de que el color esté en los detalles
          }
        });
      }
  
      // Restar el precio de la lootbox al usuario
      user.gold -= lootbox.price;
  
      // Guardar la compra, inventario y usuario
      const purchase = new LootboxPurchase(purchaseData);
      await purchase.save();
      await inventory.save();
      await user.save();
  
      // Si el item no es Gold, popular su itemId (opcional)
      if (purchase.itemReceived.itemType !== 'Gold') {
        await purchase.populate('itemReceived.itemId');
      }
  
      return res.json({
        message: '¡Lootbox abierta exitosamente!',
        itemReceived: purchase.itemReceived,
        remainingGold: user.gold
      });
    } catch (error) {
      next(error);
    }
  },

  // 8. Historial de aperturas
  async getUserLootboxHistory(req, res, next) {
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

module.exports = {
  ...lootboxController,
  upload
};
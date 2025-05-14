// inventoryController.js
const Inventory = require('../database/Models/inventoryModel');
const User = require('../database/Models/userModel');
const Item = require('../database/Models/itemsModel');
const Skin = require('../database/Models/skinModel');
const GoldConvertion = require('../database/Models/goldConvertionModel');
const RewardCoupon = require('../database/Models/rewardCouponModel');
const RewardCouponPreset = require('../database/Models/rewardCouponPreset');
const { v4: uuidv4 } = require('uuid');
const { CustomError } = require('../middlewares/errorHandler');
const FragmentsPreset = require('../database/Models/FragmentsPreset');
const FragmentsUser = require('../database/Models/FragmentsUser');

const inventoryController = {
  // 1. Obtener items activos
  async getActiveItems(req, res, next) {
    try {
      const { userId } = req.params;
      let inventory = await Inventory.findOne({ userId })
        .populate({
          path: 'activeItems.itemId',
          refPath: 'activeItems.itemType',
          select: '-__v'
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

  // 2. Obtener items usados (con paginación)
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

      const sortedItems = inventory.usedItems
        ? inventory.usedItems.sort((a, b) => new Date(b.usedAt) - new Date(a.usedAt))
        : [];

      const startIndex = (page - 1) * limit;
      const paginatedItems = sortedItems.slice(startIndex, startIndex + limit);

      res.status(200).json({
        items: paginatedItems,
        totalItems: sortedItems.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(sortedItems.length / limit),
        hasMore: startIndex + limit < sortedItems.length
      });
    } catch (error) {
      next(error);
    }
  },

  // 3. Obtener historial completo
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

      let history = (inventory.activeItems || [])
        .concat(inventory.usedItems || [])
        .sort((a, b) => new Date(b.obtainedAt) - new Date(a.obtainedAt));

      if (type) {
        history = history.filter(item => item.itemType.toLowerCase() === type.toLowerCase());
      }

      const startIndex = (page - 1) * limit;
      const paginatedItems = history.slice(startIndex, startIndex + limit);

      res.status(200).json({
        items: paginatedItems,
        totalItems: history.length,
        currentPage: parseInt(page),
        totalPages: Math.ceil(history.length / limit),
        hasMore: startIndex + limit < history.length
      });
    } catch (error) {
      next(error);
    }
  },

  // 4. Comprar y agregar item - ACTUALIZADO para resolver el problema de "Sin nombre"
  async purchaseItem(req, res, next) {
    try {
      // Extraemos el campo details del request body
      const { userId, itemType, itemId, quantity = 1, details } = req.body;
      const user = await User.findById(userId);
      if (!user) throw new CustomError('Usuario no encontrado', 404);

      let item;
      let totalCost = 0;

      if (itemType === "RewardCouponPreset") {
        item = await RewardCouponPreset.findById(itemId);
        if (!item) throw new CustomError('Cupón preset no encontrado', 404);
        totalCost = item.gold;
      } else if (itemType === "Skin") {
        item = await Skin.findById(itemId).populate('priceRP');
        if (!item) throw new CustomError('Item no encontrado', 404);
        const goldConversion = await GoldConvertion.findOne({ rpPrice: item.priceRP._id });
        if (!goldConversion) throw new CustomError('No existe una conversión de oro para este ítem', 400);
        totalCost = goldConversion.gold * quantity;
      } else {
        item = await Item.findById(itemId).populate('priceRP');
        if (!item) throw new CustomError('Item no encontrado', 404);
        const goldConversion = await GoldConvertion.findOne({ rpPrice: item.priceRP._id });
        if (!goldConversion) throw new CustomError('No existe una conversión de oro para este ítem', 400);
        totalCost = goldConversion.gold * quantity;
      }

      if (user.gold < totalCost) throw new CustomError('Oro insuficiente para realizar la compra', 400);

      user.gold -= totalCost;
      await user.save();

      let inventory = await Inventory.findOne({ userId });
      if (!inventory) inventory = new Inventory({ userId });

      // Generar un entryId único para esta entrada
      const entryId = uuidv4();

      if (itemType === "RewardCouponPreset") {
        // Para cupones, agregamos una entrada nueva sin fusionar
        inventory.activeItems.push({
          itemType: "RewardCouponPreset",
          itemId: item._id, // _id del preset
          quantity,
          obtainedFrom: 'purchase',
          goldSpent: totalCost,
          claimed: false,
          obtainedAt: new Date(),
          entryId,
          details: details || null // Usar los detalles proporcionados o null
        });
        await inventory.save();
      } else {
        // Crear detalles del ítem si no se proporcionaron
        const itemDetails = details || {
          name: itemType === 'Skin' ? item.NombreSkin : item.name || "Sin nombre",
          obtainedFrom: "purchase",
          fullInfo: true,
          srcLocal: item.srcLocal || "",
          src: itemType === 'Skin' ? item.src : item.srcWeb || ""
        };
        
        // Usar el método addItem del modelo
        await inventory.addItem({
          itemType,
          itemId: item._id,
          quantity,
          obtainedFrom: 'purchase',
          goldSpent: totalCost,
          claimed: false,
          details: itemDetails,
          entryId
        });
      }

      // Devolver inventario con items populados
      const populatedInventory = await Inventory.findById(inventory._id)
        .populate({
          path: 'activeItems.itemId',
          refPath: 'activeItems.itemType',
          select: '-__v'
        })
        .lean();

      res.status(200).json({
        message: 'Compra realizada exitosamente',
        remainingGold: user.gold,
        inventory: populatedInventory
      });
    } catch (error) {
      next(error);
    }
  },

  // 5. Usar un ítem (Skin/Item)
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

  // 6. Verificar si se puede comprar un ítem
  async canPurchaseItem(req, res, next) {
    try {
      const { userId, itemType, itemId, quantity = 1 } = req.body;
      const user = await User.findById(userId);
      if (!user) throw new CustomError('Usuario no encontrado', 404);
      const modelType = itemType.charAt(0).toUpperCase() + itemType.slice(1);
      const Model = modelType === 'Skin' ? Skin : Item;
      const item = await Model.findById(itemId).populate('priceRP');
      if (!item) throw new CustomError('Item no encontrado', 404);
      if (!item.priceRP) throw new CustomError('El item no tiene un precio definido', 400);
      const goldConversion = await GoldConvertion.findOne({ rpPrice: item.priceRP._id });
      if (!goldConversion) throw new CustomError('No existe una conversión de oro para este item', 400);
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
  },

  // 7. Reclamar un RewardCoupon (crear RewardCoupon al momento de reclamar)
  async claimRewardCoupon(req, res, next) {
    try {
      const { userId, presetId, entryId } = req.body;
      // Aseguramos que presetId sea una cadena:
      const presetIdStr = presetId && typeof presetId === 'object' ? presetId._id.toString() : presetId.toString();
      const preset = await RewardCouponPreset.findById(presetIdStr);
      if (!preset || !preset.isActive) {
        return res.status(400).json({ message: "Invalid or inactive reward coupon preset" });
      }
      let inventory = await Inventory.findOne({ userId });
      if (!inventory) {
        return res.status(400).json({ message: "No se encontró inventario para el usuario" });
      }
      // Buscar la entrada específica por entryId que aún no esté reclamada
      const entryIndex = inventory.activeItems.findIndex(item =>
        item.entryId === entryId &&
        item.itemType === "RewardCouponPreset" &&
        item.claimed === false
      );
      if (entryIndex === -1) {
        return res.status(400).json({ message: "No se encontró una entrada sin reclamar para ese cupón" });
      }
      // Marcar la entrada como reclamada
      inventory.activeItems[entryIndex].claimed = true;
      await inventory.save();
      // Crear el RewardCoupon y almacenar también el entryId (si el schema de RewardCoupon lo permite)
      const code = uuidv4();
      const newRewardCoupon = new RewardCoupon({
        userId,
        presetId: presetIdStr,
        code,
        currentUses: 0,
        entryId // Opcional: almacena el entryId de la entrada reclamada
      });
      await newRewardCoupon.save();
      res.status(201).json({
        message: "Reward coupon claimed successfully",
        coupon: newRewardCoupon,
        inventory,
      });
    } catch (error) {
      next(error);
    }
  },

  // 8. Obtener cupones reclamados de un usuario
  async getUserRewardCoupons(req, res, next) {
    try {
      const { userId } = req.params;
      const coupons = await RewardCoupon.find({ userId }).populate('presetId');
      res.status(200).json(coupons);
    } catch (error) {
      next(error);
    }
  },

  // 9. Usar un RewardCoupon
  async useRewardCoupon(req, res, next) {
    try {
      const { id } = req.params;
      const coupon = await RewardCoupon.findById(id).populate('presetId');
      if (!coupon || !coupon.isActive) {
        return res.status(400).json({ message: 'Coupon is inactive or not found' });
      }
      const expiryDate = new Date(coupon.createdAt);
      expiryDate.setDate(expiryDate.getDate() + coupon.presetId.validDays);
      if (new Date() > expiryDate) {
        coupon.isActive = false;
        await coupon.save();
        return res.status(400).json({ message: 'Coupon has expired' });
      }
      if (coupon.currentUses >= coupon.presetId.maxUses) {
        coupon.isActive = false;
        await coupon.save();
        return res.status(400).json({ message: 'Usage limit reached' });
      }
      coupon.currentUses += 1;
      if (coupon.currentUses >= coupon.presetId.maxUses) {
        coupon.isActive = false;
      }
      await coupon.save();
      // Si se completan los usos, mover la entrada a usedItems
      if (coupon.currentUses >= coupon.presetId.maxUses) {
        const inventory = await Inventory.findOne({ userId: coupon.userId });
        if (inventory) {
          const index = inventory.activeItems.findIndex(item =>
            item.itemType === 'RewardCouponPreset' &&
            item.itemId.toString() === coupon.presetId._id.toString()
          );
          if (index !== -1) {
            const activeItem = inventory.activeItems[index];
            inventory.usedItems.push({
              itemType: activeItem.itemType,
              itemId: activeItem.itemId,
              quantity: activeItem.quantity,
              obtainedFrom: activeItem.obtainedFrom,
              obtainedAt: activeItem.obtainedAt,
              goldSpent: activeItem.goldSpent,
              usedAt: new Date(),
              claimed: false,
              details: activeItem.details, // Preservar detalles
            });
            inventory.activeItems.splice(index, 1);
            await inventory.save();
          }
        }
      }
      res.json({ message: 'Reward coupon used successfully', coupon });
    } catch (error) {
      next(error);
    }
  },

  // 10. Obtener todos los cupones reclamados de un usuario
  async getRewardCouponsByUserId(req, res, next) {
    try {
      const { userId } = req.params;
      const coupons = await RewardCoupon.find({ userId })
        .populate("presetId")
        .select("-__v");
      if (!coupons || coupons.length === 0) {
        return res.status(404).json({ message: "No se encontraron cupones reclamados." });
      }
      res.status(200).json(coupons);
    } catch (error) {
      next(error);
    }
  },

  // 11. Canjear fragmentos para obtener una recompensa
  async claimFragment(req, res, next) {
    try {
      const { userId, fragmentPresetId } = req.body;
      console.log(`Procesando canje de fragmento. UserId: ${userId}, FragmentPresetId: ${fragmentPresetId}`);
      
      // 1. Buscar el preset de fragmentos
      const fragment = await FragmentsPreset.findById(fragmentPresetId);
      if (!fragment) {
        return res.status(404).json({ success: false, message: "Fragment preset not found" });
      }
      
      // 2. Verificar que el usuario tenga suficientes fragmentos
      const userFragment = await FragmentsUser.findOne({ userId, fragmentId: fragment._id });
      if (!userFragment || userFragment.fragmentQuantity < fragment.requiredQuantity) {
        return res.status(400).json({ success: false, message: "Insufficient fragments to claim reward" });
      }
  
      // 3. Obtener el inventario del usuario
      let inventory = await Inventory.findOne({ userId });
      if (!inventory) {
        inventory = await Inventory.create({
          userId,
          activeItems: [],
          usedItems: [],
          lastUpdated: new Date()
        });
      }
  
      // 4. Restar la cantidad requerida de fragmentos
      const requiredQuantity = fragment.requiredQuantity;
      userFragment.fragmentQuantity -= requiredQuantity;
      await userFragment.save();
  
      // 5. Actualizar el inventario para reflejar que se han usado fragmentos
      let remainingToRemove = requiredQuantity;
      const fragmentEntriesToUpdate = inventory.activeItems.filter(
        item => item.itemType === 'FragmentsUser' && 
               (item.itemId.toString() === userFragment._id.toString() || 
                (item.details && item.details.fragmentId && 
                 item.details.fragmentId.toString() === fragment._id.toString()))
      );
      
      // Ordenar por cantidad para eliminar primero los que tienen menor cantidad
      fragmentEntriesToUpdate.sort((a, b) => (a.quantity || 1) - (b.quantity || 1));
      
      // Array para almacenar los índices de entradas a eliminar
      const itemsToRemove = [];
      
      // Actualizar cantidades o marcar para eliminación
      for (let i = 0; i < fragmentEntriesToUpdate.length && remainingToRemove > 0; i++) {
        const entry = fragmentEntriesToUpdate[i];
        const entryQuantity = entry.quantity || 1;
        
        if (entryQuantity <= remainingToRemove) {
          // Si la cantidad de la entrada es menor o igual a lo que queda por quitar,
          // marcarla para eliminación completa
          itemsToRemove.push(inventory.activeItems.indexOf(entry));
          remainingToRemove -= entryQuantity;
        } else {
          // Si la cantidad es mayor, reducir la cantidad
          entry.quantity -= remainingToRemove;
          remainingToRemove = 0;
        }
      }
      
      // Eliminar entradas comenzando por el índice más alto para no alterar otros índices
      itemsToRemove.sort((a, b) => b - a);
      for (const index of itemsToRemove) {
        if (index !== -1) {
          inventory.activeItems.splice(index, 1);
        }
      }
  
      // 6. Procesar según el tipo de fragmento
      if (fragment.type === 'especifico') {
        // Para fragmento de item específico: agregar ese item al inventario
        const itemType = fragment.rewardType === 'skin' ? 'Skin' : 'Item';
        
        // Generar un entryId único para esta entrada
        const entryId = uuidv4();
        
        // Buscar información detallada del item/skin
        if (itemType === 'Skin') {
          // Buscar la skin en la base de datos
          const skin = await Skin.findById(fragment.itemId).populate('champion');
          if (!skin) {
            return res.status(404).json({ success: false, message: "Skin not found" });
          }
          
          // Crear detalles con la estructura exacta solicitada
          const details = {
            champion: skin.champion ? skin.champion._id : null,
            fullInfo: true,
            name: skin.NombreSkin || skin.name || "Skin sin nombre",
            obtainedFrom: "fragment_claim",
            src: skin.src || "",
            srcLocal: skin.srcLocal || ""
          };
          
          // Crear una nueva entrada en el inventario con la estructura requerida
          const newInventoryItem = {
            itemType: 'Skin',
            itemId: skin._id,
            quantity: 1,
            obtainedFrom: 'reward',
            obtainedAt: new Date(),
            goldSpent: 0,
            claimed: false,
            details: details,
            entryId: entryId
          };
          
          // Agregar al inventario
          inventory.activeItems.push(newInventoryItem);
          await inventory.save();
          
          return res.status(200).json({
            success: true,
            message: "Skin reward claimed successfully and added to inventory",
            inventoryItem: newInventoryItem,
            inventory
          });
        } else {
          // Buscar el item en la base de datos
          const item = await Item.findById(fragment.itemId);
          if (!item) {
            return res.status(404).json({ success: false, message: "Item not found" });
          }
          
          // Crear detalles con la estructura exacta solicitada
          const details = {
            champion: null, // Los items generalmente no tienen un campeón asociado
            fullInfo: true,
            name: item.name || "Item sin nombre",
            obtainedFrom: "fragment_claim",
            src: item.srcWeb || "",
            srcLocal: item.srcLocal || ""
          };
          
          // Crear una nueva entrada en el inventario con la estructura requerida
          const newInventoryItem = {
            itemType: 'Item',
            itemId: item._id,
            quantity: 1,
            obtainedFrom: 'reward',
            obtainedAt: new Date(),
            goldSpent: 0,
            claimed: false,
            details: details,
            entryId: entryId
          };
          
          // Agregar al inventario
          inventory.activeItems.push(newInventoryItem);
          await inventory.save();
          
          return res.status(200).json({
            success: true,
            message: "Item reward claimed successfully and added to inventory",
            inventoryItem: newInventoryItem,
            inventory
          });
        }
      } else if (fragment.type === 'rptype') {
        // Para fragmento de tipo RP: emitir un RewardCoupon
        let couponPreset = await RewardCouponPreset.findOne({ name: fragment.name });
        if (!couponPreset) {
          couponPreset = await RewardCouponPreset.create({
            name: fragment.name,
            percent: 100,
            maxUses: 1,
            validDays: 30,
            rpPrice: fragment.rpId,
            gold: 10000,
            type: 'lootbox',
            rpType: 'ambos',
            applicableTo: fragment.rewardType === 'skin' ? 'skins' : 'items',
            maxApplicableSkins: 1,
            isActive: true
          });
        }
        
        const entryId = uuidv4();
        const code = uuidv4();
        const newCoupon = await RewardCoupon.create({
          userId,
          presetId: couponPreset._id,
          code,
          currentUses: 0,
          isActive: true,
          entryId
        });
        
        // Crear detalles con la estructura exacta solicitada (adaptada para cupones)
        const details = {
          name: fragment.name,
          percent: 100,
          maxUses: 1,
          validDays: 30,
          rpPrice: fragment.rpId,
          gold: 10000,
          type: 'lootbox',
          rpType: 'ambos',
          applicableTo: fragment.rewardType === 'skin' ? 'skins' : 'items',
          maxApplicableSkins: 1,
          isActive: true
        };
        
        // Agregar la entrada del cupón al inventario con la estructura requerida
        inventory.activeItems.push({
          itemType: 'RewardCouponPreset',
          itemId: couponPreset._id,
          quantity: 1,
          obtainedFrom: 'reward',
          obtainedAt: new Date(),
          goldSpent: 0,
          claimed: false,
          details: details,
          entryId
        });
        
        await inventory.save();
  
        return res.status(200).json({
          success: true,
          message: "Reward coupon claimed successfully",
          coupon: newCoupon,
          inventory
        });
      } else {
        return res.status(400).json({ success: false, message: "Invalid fragment type" });
      }
    } catch (error) {
      console.error("Error en claimFragment:", error);
      next(error);
    }
  },
};

module.exports = inventoryController;
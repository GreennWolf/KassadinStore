// controllers/purcharseController.js

const Purchase = require('../database/Models/purcharseModel');
const PaymentMethod = require('../database/Models/paymentMethod');
const Skin = require('../database/Models/skinModel');
const RPPrice = require('../database/Models/rpPrice');
const RPPriceConversion = require('../database/Models/RPPriceConversion');
const Currency = require('../database/Models/currencyModel');
const CurrencyCupon = require('../database/Models/currencyCuponModel');
const Status = require('../database/Models/statusModel');
const Item = require('../database/Models/itemsModel');
const Unranked = require('../database/Models/unrankedModel');
const Cupon = require('../database/Models/cuponsModel');
const User = require('../database/Models/userModel');
const RewardCoupon = require('../database/Models/rewardCouponModel');
const RewardCouponPreset = require('../database/Models/rewardCouponPreset');
const { CustomError } = require('../middlewares/errorHandler');
const { getRankByXp } = require('./rankController');
const { calculateXp } = require('./xpConvertionController');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const { moveRewardCouponToUsedItems } = require('./cuponController');
const ranksModel = require('../database/Models/ranksModel');

const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');

async function ensureReceiptsDir() {
  try {
    await fs.mkdir(receiptsDir, { recursive: true });
  } catch (error) {
    throw new CustomError('Error al crear directorio de recibos', 500);
  }
}

// Función para simular y predecir la ganancia de XP y rank sin realizar la compra
// Función para simular y predecir la ganancia de XP y rank sin realizar la compra
const simulatePurchaseProgress = async (req, res, next) => {
  try {
    const { userId, items } = req.body;
    if (!userId || !items || !Array.isArray(items)) {
      throw new CustomError('Datos insuficientes para la simulación', 400);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('Usuario no encontrado', 404);
    }

    let totalEarnedXp = 0;
    const itemsWithQuantity = items.map(item => ({
      itemId: item._id,
      itemType: item.itemType,
      quantity: item.quantity || 1,
      isSeguro: item.isSeguroRP != undefined ? item.isSeguroRP : true
    }));

    // Calcular XP para cada ítem
    for (const item of itemsWithQuantity) {
      let itemData;
      let itemModel;
      if (item.itemType === 'Unranked') {
        itemModel = Unranked;
      } else if (item.itemType === 'Skin') {
        itemModel = Skin;
      } else {
        itemModel = Item;
      }
      
      itemData = await itemModel.findById(item.itemId).populate('priceRP');
      if (!itemData?.priceRP) {
        throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
      }
      
      // Para unrankeds usamos siempre el precio seguro
      const isSeguro = item.itemType === 'Unranked' ? true : item.isSeguro;
      const itemXp = await calculateXp(itemData.priceRP._id, isSeguro);
      totalEarnedXp += itemXp * item.quantity;
    }

    const currentRank = await getRankByXp(user.xp);
    const newXp = user.xp + totalEarnedXp;
    const newRank = await getRankByXp(newXp);
    
    let willRankUp = false;
    let goldEarned = 0;
    
    if (newRank && (!currentRank || newRank._id.toString() !== currentRank._id.toString())) {
      willRankUp = true;
      
      // Obtener todos los rangos intermedios para calcular el oro total
      const allRanks = await ranksModel.find().sort({ level: 1 });
      
      // Determinar el índice del rango actual y nuevo
      const currentRankIndex = currentRank ? allRanks.findIndex(rank => 
        rank._id.toString() === currentRank._id.toString()) : -1;
      const newRankIndex = allRanks.findIndex(rank => 
        rank._id.toString() === newRank._id.toString());
      
      // Sumar el oro de todos los rangos intermedios que se saltarán
      for (let i = currentRankIndex + 1; i <= newRankIndex; i++) {
        goldEarned += allRanks[i].gold;
      }
    }

    res.json({
      currentXp: user.xp,
      earnedXp: totalEarnedXp,
      newTotalXp: newXp,
      currentRank: currentRank ? {
        _id: currentRank._id,
        name: currentRank.name,
        level: currentRank.level,
        imageUrl: currentRank.imageUrl
      } : null,
      newRank: newRank ? {
        _id: newRank._id,
        name: newRank.name,
        level: newRank.level,
        imageUrl: newRank.imageUrl
      } : null,
      willRankUp,
      goldEarned
    });
  } catch (error) {
    next(error);
  }
};

const confirmAndUpdateUserProgress = async (req, res, next) => {
  try {
    const { purchaseId } = req.params;
    const { x2 = false } = req.body;
    
    // Buscar la compra
    const purchase = await Purchase.findById(purchaseId)
      .populate('items.itemId')
      .populate('userId');
      
    if (!purchase) {
      throw new CustomError('Compra no encontrada', 404);
    }
    
    // Comprobar si la compra ya fue procesada
    if (purchase.progressProcessed) {
      throw new CustomError('Esta compra ya fue procesada anteriormente', 400);
    }
    
    const userId = purchase.userId._id;
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('Usuario no encontrado', 404);
    }
    
    let totalEarnedXp = 0;
    
    // Calcular XP para cada ítem
    for (const item of purchase.items) {
      let itemData;
      let itemModel;
      
      if (item.itemType === 'Unranked') {
        itemModel = Unranked;
      } else if (item.itemType === 'Skin') {
        itemModel = Skin;
      } else {
        itemModel = Item;
      }
      
      itemData = await itemModel.findById(item.itemId).populate('priceRP');
      if (!itemData?.priceRP) {
        throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
      }
      
      // Para unrankeds usamos siempre el precio seguro
      const isSeguro = item.itemType === 'Unranked' ? true : item.isSeguro;
      const itemXp = await calculateXp(itemData.priceRP._id, isSeguro);
      totalEarnedXp += itemXp * item.quantity;
    }
    
    // Aplicar multiplicador x2 si está habilitado
    if (x2) {
      totalEarnedXp = totalEarnedXp * 2;
    }
    
    const oldRank = await getRankByXp(user.xp);
    user.xp += totalEarnedXp;
    const newRank = await getRankByXp(user.xp);
    
    let goldEarned = 0;
    if (newRank && (!oldRank || newRank._id.toString() !== oldRank._id.toString())) {
      user.rank = newRank._id;
      
      // Obtener todos los rangos intermedios para calcular el oro total
      const allRanks = await ranksModel.find().sort({ level: 1 });
      
      // Determinar el índice del rango actual y nuevo
      const oldRankIndex = oldRank ? allRanks.findIndex(rank => 
        rank._id.toString() === oldRank._id.toString()) : -1;
      const newRankIndex = allRanks.findIndex(rank => 
        rank._id.toString() === newRank._id.toString());
      
      // Sumar el oro de todos los rangos intermedios que se saltarán
      for (let i = oldRankIndex + 1; i <= newRankIndex; i++) {
        goldEarned += allRanks[i].gold;
      }
      
      // Actualizar el oro del usuario con la suma de todos los rangos que pasó
      user.gold += goldEarned;
    }
    
    await user.save();
    
    // Actualizar la compra para marcarla como procesada
    purchase.progressProcessed = true;
    purchase.earnedXp = totalEarnedXp;
    purchase.xpMultiplier = x2 ? 2 : 1;
    
    if (oldRank?._id.toString() !== newRank?._id.toString()) {
      purchase.rankUpgrade = {
        from: oldRank?._id,
        to: newRank?._id,
        goldEarned: goldEarned
      };
    }
    
    await purchase.save();
    
    res.json({
      message: 'Progreso del usuario actualizado correctamente',
      earnedXp: totalEarnedXp,
      oldRank,
      newRank,
      currentXp: user.xp,
      currentGold: user.gold,
      goldEarned,
      xpMultiplier: x2 ? 2 : 1
    });
    
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────
// ACTUALIZAR DATOS DE CUENTA (para cuentas Unranked)
const chargeAccountData = async (purchaseId, itemId, accountData) => {
  try {
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      throw new CustomError('Compra no encontrada', 404);
    }

    // Encontrar el ítem específico en el array de items
    const itemIndex = purchase.items.findIndex(
      item => item.itemId.toString() === itemId && item.itemType === 'Unranked'
    );

    if (itemIndex === -1) {
      throw new CustomError('Item no encontrado en la compra o no es una cuenta Unranked', 404);
    }

    // Actualizar los datos de la cuenta
    purchase.items[itemIndex].accountData = {
      email: accountData.email,
      password: accountData.password
    };

    await purchase.save();
    return purchase;
  } catch (error) {
    throw error;
  }
};

// ────────────────────────────────────────────────────────────────
// ACTUALIZAR PROGRESO DEL USUARIO (XP, RANK, GOLD, etc.)
async function calculateAndUpdateUserProgress(userId, items) {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new CustomError('Usuario no encontrado', 404);
    }

    let totalEarnedXp = 0;

    // Calcular XP para cada ítem
    for (const item of items) {
      let itemData;
      let itemModel;
      if (item.itemType === 'Unranked') {
        itemModel = Unranked;
      } else if (item.itemType === 'Skin') {
        itemModel = Skin;
      } else {
        itemModel = Item;
      }
      itemData = await itemModel.findById(item.itemId).populate('priceRP');
      if (!itemData?.priceRP) {
        throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
      }
      // Para unrankeds usamos siempre el precio seguro
      const isSeguro = item.itemType === 'Unranked' ? true : item.isSeguro;
      const itemXp = await calculateXp(itemData.priceRP._id, isSeguro);
      totalEarnedXp += itemXp * item.quantity;
    }

    const oldRank = await getRankByXp(user.xp);
    user.xp += totalEarnedXp;
    const newRank = await getRankByXp(user.xp);

    if (newRank && (!oldRank || newRank._id.toString() !== oldRank._id.toString())) {
      user.rank = newRank._id;
      user.gold += newRank.gold;
    }

    await user.save();

    return {
      earnedXp: totalEarnedXp,
      oldRank,
      newRank,
      currentXp: user.xp,
      currentGold: user.gold
    };
  } catch (error) {
    throw error;
  }
}

// ────────────────────────────────────────────────────────────────
// CALCULA EL PRECIO DEL ÍTEM (usando la conversión según RP)
async function calculateItemPrice(item, itemData, conversion) {
  const price = item.isUnranked
    ? conversion.priceSeguro
    : (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);
  return price * item.quantity;
}

// ────────────────────────────────────────────────────────────────
// VALIDACIÓN DE ÍTEMS DE COMPRA
// Se agrega "selectedForCoupon" (por defecto 0) para conocer la cantidad a la que se aplicará el descuento
async function validatePurchaseItems(items, selectedCurrency) {
  let totalPrice = 0;
  let totalRP = 0;

  const itemsWithQuantity = items.map(item => {
    if (!item._id || !item.quantity || !item.itemType) {
      throw new CustomError('Formato de items inválido', 400);
    }
    return {
      itemId: item._id,
      isSkin: item.isSkin,
      isUnranked: item.isUnranked,
      itemType: item.itemType,
      quantity: item.quantity || 1,
      isSeguro: item.isSeguroRP != undefined && item.isSeguroRP != null ? item.isSeguroRP : true,
      selectedForCoupon: item.selectedForCoupon || 0,
      ...(item.isUnranked && {
        itemDetails: {
          region: item.region,
          nivel: item.nivel,
          escencia: item.escencia,
          escenciaNaranja: item.escenciaNaranja,
          rpAmount: item.rpAmount,
          handUpgrade: item.handUpgrade
        }
      })
    };
  });

  for (const item of itemsWithQuantity) {
    let itemData;
    let itemModel;
    if (item.isUnranked) {
      itemModel = Unranked;
    } else if (item.isSkin) {
      itemModel = Skin;
    } else {
      itemModel = Item;
    }

    itemData = await itemModel.findById(item.itemId).populate('priceRP');
    if (!itemData?.priceRP) {
      throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
    }

    const rpPriceDoc = await RPPrice.findById(itemData.priceRP);
    if (rpPriceDoc) {
      totalRP += rpPriceDoc.valueRP * item.quantity;
    }

    const conversion = await RPPriceConversion.findOne({
      rpPrice: itemData.priceRP,
      currency: selectedCurrency
    });

    if (!conversion) {
      throw new CustomError('Conversión de precio no encontrada', 404);
    }

    const price = item.isUnranked
      ? conversion.priceSeguro
      : (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);

    totalPrice += price * item.quantity;
  }

  return { itemsWithQuantity, totalPrice, totalRP };
}

// ────────────────────────────────────────────────────────────────
// VALIDACIÓN Y APLICACIÓN DE CUPÓN (mixto)
// Si cuponId es un ObjectId válido se trata como cupón normal; de lo contrario, como reward coupon.
// En el caso de reward coupon, se calcula el descuento solo sobre las unidades indicadas en selectedForCoupon.
async function validateAndApplyCupon(cuponId, itemsWithQuantity, selectedCurrency, userId) {
  // Calcular total base sin descuento
  let baseTotal = 0;
  for (const item of itemsWithQuantity) {
    let itemModel;
    if (item.isUnranked) {
      itemModel = Unranked;
    } else if (item.isSkin) {
      itemModel = Skin;
    } else {
      itemModel = Item;
    }
    const itemData = await itemModel.findById(item.itemId).populate('priceRP');
    if (!itemData?.priceRP) {
      throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
    }
    const conversion = await RPPriceConversion.findOne({
      rpPrice: itemData.priceRP,
      currency: selectedCurrency
    });
    if (!conversion) {
      throw new CustomError('Conversión de precio no encontrada', 404);
    }
    const price = item.isUnranked
      ? conversion.priceSeguro
      : (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);
    baseTotal += price * item.quantity;
  }

  if (!cuponId || cuponId === "undefined" || typeof cuponId === "undefined") {
    return { 
      discountAmount: 0, 
      finalPrice: baseTotal,
      eligibleTotal: baseTotal,
      nonEligibleTotal: 0,
      couponType: null
    };
  }

  // CUPÓN NORMAL: si cuponId es un ObjectId válido
  if (mongoose.Types.ObjectId.isValid(cuponId)) {
    const cupon = await Cupon.findById(cuponId);
    if (!cupon) {
      throw new CustomError('Cupón no válido', 400);
    }
    if (
      !cupon.isActive ||
      (cupon.maxUses > 0 && cupon.currentUses >= cupon.maxUses) ||
      (!cupon.isInfinite && new Date() > new Date(cupon.validUntil))
    ) {
      throw new CustomError('Cupón expirado o alcanzó el límite de uso', 400);
    }

    let eligibleTotal = 0;
    let nonEligibleTotal = 0;

    // Determinar ítems elegibles según rpType
    for (const item of itemsWithQuantity) {
      let itemModel;
      if (item.isUnranked) {
        itemModel = Unranked;
      } else if (item.isSkin) {
        itemModel = Skin;
      } else {
        itemModel = Item;
      }
      const itemData = await itemModel.findById(item.itemId).populate('priceRP');
      const conversion = await RPPriceConversion.findOne({
        rpPrice: itemData.priceRP,
        currency: selectedCurrency
      });
      if (!conversion) {
        throw new CustomError('Conversión de precio no encontrada', 404);
      }
      const itemPrice = item.isUnranked
        ? conversion.priceSeguro
        : (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);
      const totalItemPrice = itemPrice * item.quantity;
      const isSeguroItem = item.isUnranked ? true : item.isSeguro;
      if (
        cupon.rpType === 'ambos' ||
        (cupon.rpType === 'seguro' && isSeguroItem) ||
        (cupon.rpType === 'barato' && !isSeguroItem)
      ) {
        eligibleTotal += totalItemPrice;
      } else {
        nonEligibleTotal += totalItemPrice;
      }
    }

    let discountAmount = 0;
    if (cupon.type === 'percent') {
      discountAmount = (eligibleTotal * cupon.value) / 100;
    } else if (cupon.type === 'fixed') {
      const currencyCupon = await CurrencyCupon.findOne({
        cupon: cuponId,
        currency: selectedCurrency
      });
      if (currencyCupon) {
        discountAmount = Math.min(currencyCupon.value, eligibleTotal);
      }
    }

    // Incrementar el contador de usos
    await Cupon.findByIdAndUpdate(cuponId, { $inc: { currentUses: 1 } });
    const finalPrice = (eligibleTotal - discountAmount) + nonEligibleTotal;
    return {
      discountAmount,
      finalPrice,
      eligibleTotal,
      nonEligibleTotal,
      couponType: 'normal'
    };

  } else {
    // REWARD COUPON: cuponId es un código
    const rewardCoupon = await RewardCoupon.findOne({ code: cuponId, userId }).populate('presetId');
    if (!rewardCoupon) {
      throw new CustomError('Cupón de recompensa no válido', 400);
    }
    if (!rewardCoupon.isActive) {
      throw new CustomError('El cupón de recompensa está inactivo', 400);
    }
    // Verificar expiración (createdAt + validDays)
    const validDays = rewardCoupon.presetId.validDays;
    const expirationDate = new Date(rewardCoupon.createdAt);
    expirationDate.setDate(expirationDate.getDate() + validDays);
    if (new Date() > expirationDate) {
      rewardCoupon.isActive = false;
      await rewardCoupon.save();
      throw new CustomError('El cupón de recompensa ha expirado', 400);
    }
    // Verificar límite de usos antes de aplicar descuento
    if (rewardCoupon.currentUses >= rewardCoupon.presetId.maxUses) {
      rewardCoupon.isActive = false;
      await rewardCoupon.save();
      await moveRewardCouponToUsedItems(userId, rewardCoupon.presetId._id);
      throw new CustomError('El cupón de recompensa ha alcanzado el máximo de usos', 400);
    }
    
    // Calcular el descuento: para cada ítem se aplica el descuento solo a las unidades seleccionadas
    let discountAmount = 0;
    for (const item of itemsWithQuantity) {
      let itemModel;
      if (item.isUnranked) {
        itemModel = Unranked;
      } else if (item.isSkin) {
        itemModel = Skin;
      } else {
        itemModel = Item;
      }
      const itemData = await itemModel.findById(item.itemId).populate('priceRP');
      if (!itemData?.priceRP) {
        throw new CustomError(`Item no encontrado o sin precio: ${item.itemId}`, 404);
      }
      const conversion = await RPPriceConversion.findOne({
        rpPrice: itemData.priceRP,
        currency: selectedCurrency
      });
      if (!conversion) {
        throw new CustomError('Conversión de precio no encontrada', 404);
      }
      const unitPrice = item.isUnranked
        ? conversion.priceSeguro
        : (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);
      const discountCount = item.selectedForCoupon || 0;
      discountAmount += unitPrice * discountCount * (rewardCoupon.presetId.percent / 100);
    }
    
    const finalPrice = baseTotal - discountAmount;
    
    // Incrementar el contador de usos del reward coupon
    rewardCoupon.currentUses += 1;
    await rewardCoupon.save();
    if (rewardCoupon.currentUses >= rewardCoupon.presetId.maxUses) {
      rewardCoupon.isActive = false;
      await rewardCoupon.save();
      await moveRewardCouponToUsedItems(userId, rewardCoupon.presetId._id);
    }
    
    return {
      discountAmount,
      finalPrice,
      eligibleTotal: baseTotal,
      nonEligibleTotal: 0,
      couponType: 'reward'
    };
  }
}

// ────────────────────────────────────────────────────────────────
// purchaseController
const purchaseController = {

  createPurchase: async (req, res, next) => {
    try {
      // Se espera recibir cuponId (ya sea ObjectId para cupón normal o código para reward coupon)
      const { userId, items, paymentMethodId, riotName, discordName, region, selectedCurrency, cuponId } = req.body;
      if (!riotName || !req.file) {
        throw new CustomError('Faltan datos requeridos', 400);
      }
  
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);
      if (!paymentMethod) {
        throw new CustomError('Método de pago no válido', 400);
      }
  
      await ensureReceiptsDir();
  
      const jsItemsObject = JSON.parse(items);
      const { itemsWithQuantity, totalPrice, totalRP } = await validatePurchaseItems(jsItemsObject, selectedCurrency);
  
      // Validar y aplicar cupón (la función detecta si es normal o reward)
      const { discountAmount, finalPrice, couponType } = await validateAndApplyCupon(
        cuponId,
        itemsWithQuantity,
        selectedCurrency,
        userId
      );
  
      const defaultStatus = await Status.findOne({ default: true });
      if (!defaultStatus) {
        throw new CustomError('No se encontró un status por defecto', 500);
      }
  
      // Ya no calculamos el progreso del usuario aquí
      // Eso lo hará el admin cuando confirme la compra
  
      const newPurchase = new Purchase({
        userId,
        items: itemsWithQuantity,
        paymentMethodId,
        receipt: req.file.filename,
        riotName,
        discordName,
        region,
        cupon: couponType === 'normal' ? cuponId : null,
        rewardCoupon: couponType === 'reward' ? cuponId : null,
        couponType,
        Total: finalPrice,
        originalPrice: totalPrice,
        discountAmount,
        currencyId: selectedCurrency,
        totalRP,
        status: {
          statusId: defaultStatus._id,
          estadoConfirmado: false,
          confirmadoEn: null
        },
        earnedXp: 0, // Inicialmente 0, se actualizará cuando el admin procese la compra
        progressProcessed: false, // Marcamos la compra como no procesada
      });
  
      await newPurchase.save();
  
      const uploadPath = path.join(receiptsDir, req.file.filename);
      await fs.rename(req.file.path, uploadPath);
  
      res.status(201).json(newPurchase);
    } catch (error) {
      next(error);
    }
  },

  getAllPurchases: async (req, res, next) => {
    try {
      const purchases = await Purchase.find()
        .populate('userId')
        .populate('status.statusId')
        .populate('paymentMethodId')
        .populate({
          path: 'items.itemId',
          populate: {
            path: 'priceRP'
          }
        })
        .populate({
          path: 'rankUpgrade',
          populate: [{ path: 'from' }, { path: 'to' }]
        });
      res.json(purchases);
    } catch (error) {
      next(error);
    }
  },

  updatePurchase: async (req, res, next) => {
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

      const updatedPurchase = await Purchase.findByIdAndUpdate(id, updates, { new: true }).populate('status.statusId');
      if (!updatedPurchase) {
        throw new CustomError('Compra no encontrada', 404);
      }
      res.json(updatedPurchase);
    } catch (error) {
      next(error);
    }
  },

  deletePurchase: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedPurchase = await Purchase.findByIdAndDelete(id);
      if (!deletedPurchase) {
        throw new CustomError('Compra no encontrada', 404);
      }
      res.json({ message: 'Compra eliminada exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  getUnreadPurchases: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const unreadPurchases = await Purchase.find({
        userId,
        statusChangeViewed: false,
        statusChangedAt: { $ne: null }
      })
        .populate('status')
        .populate('currencyId')
        .populate('status.statusId')
        .populate({
          path: 'items.itemId',
          populate: { path: 'priceRP' }
        })
        .sort({ statusChangedAt: -1 });
      res.json(unreadPurchases);
    } catch (error) {
      next(error);
    }
  },

  markStatusAsViewed: async (req, res, next) => {
    try {
      const { purchaseId } = req.params;
      const purchase = await Purchase.findByIdAndUpdate(
        purchaseId,
        { statusChangeViewed: true },
        { new: true }
      );
      if (!purchase) {
        throw new CustomError('Compra no encontrada', 404);
      }
      res.json(purchase);
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const count = await Purchase.countDocuments({
        userId,
        statusChangeViewed: false,
        statusChangedAt: { $ne: null }
      });
      res.json({ count });
    } catch (error) {
      next(error);
    }
  },

  getTotalPurchases: async (req, res, next) => {
    try {
      const { userId } = req.params;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      const totalPurchases = await Purchase.countDocuments({ userId });
      res.json({ totalPurchases });
    } catch (error) {
      next(error);
    }
  },

  checkCuponUsage: async (req, res, next) => {
    try {
      const { userId, cuponId } = req.params;
      const purchase = await Purchase.findOne({ userId, cupon: cuponId });
      res.json({
        hasUsed: !!purchase,
        purchase: purchase
          ? { _id: purchase._id, date: purchase.createdAt }
          : null
      });
    } catch (error) {
      next(error);
    }
  },

  chargeAccountData: async (req, res, next) => {
    try {
      const { purchaseId, itemId } = req.params;
      const { email, password } = req.body;
      const updatedPurchase = await chargeAccountData(purchaseId, itemId, { email, password });
      res.json({
        message: 'Datos de cuenta actualizados exitosamente',
        purchase: updatedPurchase
      });
    } catch (error) {
      next(error);
    }
  }
};

// ────────────────────────────────────────────────────────────────
// statusController (funciones relacionadas al manejo de estados)
const statusController = {
  createStatus: async (req, res, next) => {
    try {
      const { status, defaultValue, description, color, confirmacion, confirmacionText, confirmationAction } = req.body;
      if (!status || !description || !color) {
        throw new CustomError('Los campos status, description y color son requeridos', 400);
      }
      if (defaultValue) {
        await Status.updateMany({ default: true }, { $set: { default: false } });
      }
      if (confirmacion && confirmationAction) {
        if (confirmationAction.type === 'changeStatus') {
          const targetStatus = await Status.findById(confirmationAction.config.targetStatus);
          if (!targetStatus) {
            throw new CustomError('El estado objetivo no existe', 400);
          }
          await Status.validateStatusChain(confirmationAction.config.targetStatus);
        } else if (confirmationAction.type === 'startTimer') {
          if (!confirmationAction.config.time || confirmationAction.config.time <= 0) {
            throw new CustomError('El tiempo debe ser un número positivo', 400);
          }
        }
      }
      const newStatus = new Status({
        status,
        default: defaultValue || false,
        description,
        color,
        confirmacion: confirmacion || false,
        confirmacionText: confirmacionText || 'Confirmar',
        confirmationAction: confirmacion ? confirmationAction : undefined,
        active: true
      });
      await newStatus.save();
      res.status(201).json(newStatus);
    } catch (error) {
      next(error);
    }
  },

  getAllStatus: async (req, res, next) => {
    try {
      const statuses = await Status.find();
      res.json(statuses);
    } catch (error) {
      next(error);
    }
  },

  getStatusById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const status = await Status.findById(id);
      if (!status) {
        throw new CustomError('Estado no encontrado', 404);
      }
      res.json(status);
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      if (updates.confirmationAction) {
        if (updates.confirmationAction.type === 'changeStatus') {
          const targetStatus = await Status.findById(updates.confirmationAction.config.targetStatus);
          if (!targetStatus) {
            throw new CustomError('El estado objetivo no existe', 400);
          }
          await Status.validateStatusChain(updates.confirmationAction.config.targetStatus);
        } else if (updates.confirmationAction.type === 'startTimer') {
          if (!updates.confirmationAction.config.time || updates.confirmationAction.config.time <= 0) {
            throw new CustomError('El tiempo debe ser un número positivo', 400);
          }
        }
      }
      if (updates.default) {
        await Status.updateMany({ default: true }, { $set: { default: false } });
      }
      const updatedStatus = await Status.findByIdAndUpdate(id, updates, { new: true });
      if (!updatedStatus) {
        throw new CustomError('Estado no encontrado', 404);
      }
      res.json(updatedStatus);
    } catch (error) {
      next(error);
    }
  },

  deleteStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const deletedStatus = await Status.findByIdAndDelete(id);
      if (!deletedStatus) {
        throw new CustomError('Estado no encontrado', 404);
      }
      res.json({ message: 'Estado eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  },

  confirmPurchaseStatus: async (req, res, next) => {
    try {
      const { purchaseId } = req.params;
      const purchase = await Purchase.findById(purchaseId).populate({
        path: 'status.statusId',
        model: 'Status'
      });
      if (!purchase) {
        throw new CustomError('Compra no encontrada', 404);
      }
      const currentStatus = purchase.status.statusId;
      if (!currentStatus.confirmacion) {
        throw new CustomError('Este estado no requiere confirmación', 400);
      }
      if (purchase.status.estadoConfirmado) {
        throw new CustomError('Este estado ya fue confirmado', 400);
      }
      if (currentStatus.confirmationAction) {
        switch (currentStatus.confirmationAction.type) {
          case 'startTimer': {
            const timerDuration = currentStatus.confirmationAction.config.time;
            purchase.timerEndTime = new Date(Date.now() + timerDuration * 60 * 1000);
            purchase.status.estadoConfirmado = true;
            purchase.status.confirmadoEn = new Date();
            break;
          }
          case 'changeStatus': {
            const newStatusId = currentStatus.confirmationAction.config.targetStatus;
            const newStatus = await Status.findById(newStatusId);
            if (!newStatus) {
              throw new CustomError('Estado objetivo no encontrado', 404);
            }
            purchase.status = {
              statusId: newStatusId,
              estadoConfirmado: false,
              confirmadoEn: null
            };
            purchase.statusChangedAt = new Date();
            purchase.statusChangeViewed = false;
            break;
          }
          default:
            purchase.status.estadoConfirmado = true;
            purchase.status.confirmadoEn = new Date();
        }
      } else {
        purchase.status.estadoConfirmado = true;
        purchase.status.confirmadoEn = new Date();
      }
      await purchase.save();
      await purchase.populate('status.statusId');
      res.json({ message: 'Estado confirmado exitosamente', purchase });
    } catch (error) {
      next(error);
    }
  },

  getPurchasesNeedingConfirmation: async (req, res, next) => {
    try {
      const { userId } = req.params;
      const purchases = await Purchase.find({
        userId,
        'status.estadoConfirmado': false
      })
        .populate({
          path: 'status.statusId',
          model: 'Status',
          match: { confirmacion: true }
        })
        .populate('currencyId')
        .populate({
          path: 'items.itemId',
          populate: { path: 'priceRP' }
        });
      const filteredPurchases = purchases.filter(purchase => purchase.status.statusId !== null);
      res.json(filteredPurchases);
    } catch (error) {
      next(error);
    }
  },

  chargeAccountData: async (req, res, next) => {
    try {
      const { purchaseId, itemId } = req.params;
      const { email, password } = req.body;
      const updatedPurchase = await chargeAccountData(purchaseId, itemId, { email, password });
      res.json({ message: 'Datos de cuenta actualizados exitosamente', purchase: updatedPurchase });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = {
  ...purchaseController,
  ...statusController,
  simulatePurchaseProgress,
  confirmAndUpdateUserProgress
};

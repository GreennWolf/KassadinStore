const Purchase = require('../database/Models/purcharseModel');
const PaymentMethod = require('../database/Models/paymentMethod');
const Skin = require('../database/Models/skinModel');
const RPPrice = require('../database/Models/rpPrice');
const RPPriceConversion = require('../database/Models/RPPriceConversion');
const Currency = require('../database/Models/currencyModel');
const CurrencyCupon = require('../database/Models/currencyCuponModel')
const Status = require('../database/Models/statusModel');
const Item = require('../database/Models/itemsModel');
const Unranked = require('../database/Models/unrankedModel');
const Cupon = require('../database/Models/cuponsModel');
const User = require('../database/Models/userModel')
const { CustomError } = require('../middlewares/errorHandler');
const { getRankByXp } = require('./rankController');
const { calculateXp } = require('./xpConvertionController');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose')

const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');

async function ensureReceiptsDir() {
    try {
        await fs.mkdir(receiptsDir, { recursive: true });
    } catch (error) {
        throw new CustomError('Error al crear directorio de recibos', 500);
    }
}

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

async function calculateAndUpdateUserProgress(userId, currencyId, finalPrice) {
    try {
        // Obtener el usuario
        const user = await User.findById(userId);
        if (!user) {
            throw new CustomError('Usuario no encontrado', 404);
        }

        // Calcular XP ganado proporcionalmente al precio final
        const earnedXp = await  calculateXp(currencyId,finalPrice);

        // Obtener el rango actual del usuario
        const oldRank = await getRankByXp(user.xp);
        
        // Actualizar XP del usuario
        const newxp = user.xp += earnedXp;

        user.xp=newxp

        // Obtener el nuevo rango basado en el XP actualizado
        const newRank = await getRankByXp(user.xp);

        // Si hay un nuevo rango y es diferente al anterior, actualizar el rango y dar el oro de recompensa
        if (newRank && (!oldRank || newRank._id.toString() !== oldRank._id.toString())) {
            user.rank = newRank._id;
            user.gold += newRank.gold; // Bonus de oro por subir de rango
        }

        // Guardar los cambios
        await user.save();

        return {
            earnedXp,
            oldRank,
            newRank,
            currentXp: user.xp,
            currentGold: user.gold
        };
    } catch (error) {
        throw error;
    }
}

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
            // Guardar detalles adicionales para unrankeds
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
        
        // Para unrankeds, siempre usamos el precio seguro
        const price = item.isUnranked ? conversion.priceSeguro : 
                     (item.isSeguro ? conversion.priceSeguro : conversion.priceBarato);

        totalPrice += price * item.quantity;
    }

    return { itemsWithQuantity, totalPrice, totalRP };
}

async function validateAndApplyCupon(cuponId, totalPrice, selectedCurrency) {
    if (!cuponId || cuponId === "undefined" || typeof cuponId === "undefined") {
        return { discountAmount: 0, finalPrice: totalPrice };
    }
    const cupon = await Cupon.findById(cuponId);
    if (!cupon) {
        throw new CustomError('Cupón no válido', 400);
    }

    if (!cupon.isActive || 
        (cupon.maxUses > 0 && cupon.currentUses >= cupon.maxUses) ||
        (!cupon.isInfinite && new Date() > new Date(cupon.validUntil))) {
        throw new CustomError('Cupón expirado o alcanzó el límite de uso', 400);
    }

    let discountAmount = 0;
    if (cupon.type === 'percent') {
        discountAmount = (totalPrice * cupon.value) / 100;
    } else if (cupon.type === 'fixed') {
        const currencyCupon = await CurrencyCupon.findOne({
            cupon: cuponId,
            currency: selectedCurrency
        });
        if (currencyCupon) {
            discountAmount = currencyCupon.value;
        }
    }

    await Cupon.findByIdAndUpdate(cuponId, { $inc: { currentUses: 1 } });
    return { discountAmount, finalPrice: totalPrice - discountAmount };
}

const purchaseController = {
    createPurchase: async (req, res, next) => {
        try {
            const { userId, items, paymentMethodId, riotName,discordName ,region, selectedCurrency, cuponId } = req.body;
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
            const { discountAmount, finalPrice } = await validateAndApplyCupon(cuponId, totalPrice, selectedCurrency);

            const defaultStatus = await Status.findOne({ default: true });
            if (!defaultStatus) {
                throw new CustomError('No se encontró un estado por defecto', 500);
            }

            const progressUpdate = await calculateAndUpdateUserProgress(userId, selectedCurrency, finalPrice);

            const newPurchase = new Purchase({
                userId,
                items: itemsWithQuantity,
                paymentMethodId,
                receipt: req.file.filename,
                riotName,
                discordName,
                region,
                cupon: cuponId && mongoose.Types.ObjectId.isValid(cuponId) ? cuponId : null,
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
                earnedXp: progressUpdate.earnedXp,
                rankUpgrade: progressUpdate.oldRank?._id.toString() !== progressUpdate.newRank._id.toString()
                    ? {
                        from: progressUpdate.oldRank?._id,
                        to: progressUpdate.newRank._id,
                        goldEarned: progressUpdate.newRank.gold
                    }
                    : null
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
                    populate: [
                        { path: 'from' },
                        { path: 'to' }
                    ]
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
    
            // Si se está actualizando el status
            if (updates.status) {
                const newStatus = await Status.findById(updates.status);
                if (!newStatus) {
                    throw new CustomError('Estado no encontrado', 404);
                }
    
                updates.status = {
                    statusId: newStatus._id,
                    estadoConfirmado: false, // Reset confirmación al cambiar estado
                    confirmadoEn: null
                };
                updates.statusChangedAt = new Date();
                updates.statusChangeViewed = false;
            }
    
            const updatedPurchase = await Purchase.findByIdAndUpdate(
                id,
                updates,
                { new: true }
            ).populate('status.statusId');
    
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
                populate: {
                    path: 'priceRP'
                }
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
                {
                    statusChangeViewed: true
                },
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
    
            // Validar que se haya pasado el userId
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
    
            // Contar el número de compras del usuario
            const totalPurchases = await Purchase.countDocuments({ userId });
    
            res.json({ totalPurchases });
        } catch (error) {
            next(error);
        }
    }
};

const statusController = {
    createStatus: async (req, res, next) => {
        try {
            const { 
                status, 
                defaultValue, 
                description, 
                color, 
                confirmacion,
                confirmacionText,
                confirmationAction 
            } = req.body;
    
            // Validar campos requeridos
            if (!status || !description || !color) {
                throw new CustomError('Los campos status, description y color son requeridos', 400);
            }
    
            // Si es estado por defecto, desactivar otros estados por defecto
            if (defaultValue) {
                await Status.updateMany(
                    { default: true }, 
                    { $set: { default: false } }
                );
            }

            // Validar la acción de confirmación si está presente
            if (confirmacion && confirmationAction) {
                if (confirmationAction.type === 'changeStatus') {
                    // Validar que el estado objetivo existe
                    const targetStatus = await Status.findById(confirmationAction.config.targetStatus);
                    if (!targetStatus) {
                        throw new CustomError('El estado objetivo no existe', 400);
                    }
                    // Validar que no hay ciclos en la cadena de estados
                    await Status.validateStatusChain(confirmationAction.config.targetStatus);
                }
                else if (confirmationAction.type === 'startTimer') {
                    // Validar que el tiempo es un número positivo
                    if (!confirmationAction.config.time || confirmationAction.config.time <= 0) {
                        throw new CustomError('El tiempo debe ser un número positivo', 400);
                    }
                }
            }
    
            // Crear el nuevo estado
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

            // Si se está actualizando la acción de confirmación
            if (updates.confirmationAction) {
                if (updates.confirmationAction.type === 'changeStatus') {
                    // Validar que el estado objetivo existe
                    const targetStatus = await Status.findById(updates.confirmationAction.config.targetStatus);
                    if (!targetStatus) {
                        throw new CustomError('El estado objetivo no existe', 400);
                    }
                    // Validar que no hay ciclos
                    await Status.validateStatusChain(updates.confirmationAction.config.targetStatus);
                }
                else if (updates.confirmationAction.type === 'startTimer') {
                    // Validar que el tiempo es un número positivo
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
    
            const purchase = await Purchase.findById(purchaseId)
                .populate({
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
    
            // Manejar acciones de confirmación
            if (currentStatus.confirmationAction) {
                switch (currentStatus.confirmationAction.type) {
                    case 'startTimer':
                        const timerDuration = currentStatus.confirmationAction.config.time;
                        purchase.timerEndTime = new Date(Date.now() + (timerDuration * 60 * 1000));
                        purchase.status.estadoConfirmado = true;
                        purchase.status.confirmadoEn = new Date();
                        break;
    
                    case 'changeStatus':
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
    
                    default:
                        purchase.status.estadoConfirmado = true;
                        purchase.status.confirmadoEn = new Date();
                }
            } else {
                // Si no hay acción específica, solo marcar como confirmado
                purchase.status.estadoConfirmado = true;
                purchase.status.confirmadoEn = new Date();
            }
            
            await purchase.save();
    
            // Poblar el status después de guardar
            await purchase.populate('status.statusId');
    
            res.json({
                message: 'Estado confirmado exitosamente',
                purchase: purchase
            });
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
            }).populate({
                path: 'status.statusId',
                model: 'Status',
                match: { confirmacion: true }
            }).populate('currencyId')
            .populate({
                path: 'items.itemId',
                populate: {
                    path: 'priceRP'
                }
            });
    
            // Filtrar solo las compras que tienen un estado que requiere confirmación
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

            res.json({
                message: 'Datos de cuenta actualizados exitosamente',
                purchase: updatedPurchase
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = statusController;

module.exports = {
    ...purchaseController,
    ...statusController
};
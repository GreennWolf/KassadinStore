const EloBoostOrder = require('../database/Models/eloBoostOrderModel');
const EloBoostRank = require('../database/Models/eloBoostRankModel');
const EloBoostConfig = require('../database/Models/eloBoostConfigModel');
const Champion = require('../database/Models/championModel');
const User = require('../database/Models/userModel');
const Currency = require('../database/Models/currencyModel');
const RPPriceConversion = require('../database/Models/RPPriceConversion');
const { CustomError } = require('../middlewares/errorHandler');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Clave para encriptar/desencriptar información sensible (debe estar en variables de entorno)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'eloboost-encryption-key-32-bytes-!!';
// Directorio para almacenar los recibos (igual que en purchaseController)
const receiptsDir = path.join(__dirname, '..', 'public', 'receipts');

// Asegurar que exista el directorio de recibos
async function ensureReceiptsDir() {
  try {
    await fs.mkdir(receiptsDir, { recursive: true });
  } catch (error) {
    console.error('Error al crear directorio de recibos:', error);
    throw new Error('Error al procesar directorio de recibos: ' + error.message);
  }
};

// Asegurarnos que la clave tenga exactamente 32 bytes (256 bits) para AES-256
const getFixedLengthKey = (key) => {
    // Si la clave es menor a 32 bytes, rellenarla
    if (key.length < 32) {
        return key.padEnd(32, '0');
    }
    // Si la clave es mayor a 32 bytes, truncarla
    if (key.length > 32) {
        return key.substring(0, 32);
    }
    return key;
};
const FIXED_KEY = getFixedLengthKey(ENCRYPTION_KEY);
const IV_LENGTH = 16; // Para AES, IV es de 16 bytes

// Funciones de encriptación
function encrypt(text) {
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(FIXED_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error('Error en la encriptación:', error);
        throw new Error('Error al procesar datos sensibles: ' + error.message);
    }
}

function decrypt(text) {
    try {
        const parts = text.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encryptedText = Buffer.from(parts[1], 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(FIXED_KEY), iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (error) {
        console.error('Error en la desencriptación:', error);
        throw new Error('Error al procesar datos sensibles: ' + error.message);
    }
}

// Función para crear una nueva orden de EloBoost
async function createEloBoostOrder(req, res, next) {
    try {
        const {
            currentRankId, currentDivision,
            targetRankId, targetDivision,
            queueType,
            specificRole, specificRoleValue,
            specificChampion, specificChampionId,
            duoQueue,
            baseRPPrice, totalRPPrice, additionalRPCost,
            basePrice, totalPrice, additionalCost,
            currencyId,  // Ahora es obligatorio
            userId       // Ahora recibimos el userId del cliente
        } = req.body;

        // Verificar moneda y usuario
        const currency = await Currency.findById(currencyId);
        if (!currency) {
            throw new CustomError('Moneda no encontrada', 404);
        }

        // Verificar usuario
        const user = userId ? await User.findById(userId) : null;
        // Temporalmente deshabilitamos esta validación
        // if (!user) {
        //     throw new CustomError('Usuario no encontrado', 404);
        // }

        // Validar que los rangos existan
        const currentRank = await EloBoostRank.findById(currentRankId).populate('rankUpPriceRP').populate('divisionPriceRP');
        const targetRank = await EloBoostRank.findById(targetRankId).populate('rankUpPriceRP').populate('divisionPriceRP');
        if (!currentRank || !targetRank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Verificar campeón específico si se proporciona
        let championReference = null;
        if (specificChampion && specificChampionId) {
            championReference = await Champion.findById(specificChampionId);
            if (!championReference) {
                throw new CustomError('Campeón no encontrado', 404);
            }
        }

        // Verificar que existan conversiones de RP para los precios
        const rankUpConversion = await RPPriceConversion.findOne({
            rpPrice: currentRank.rankUpPriceRP._id,
            currency: currencyId
        });

        const divisionConversion = await RPPriceConversion.findOne({
            rpPrice: currentRank.divisionPriceRP._id,
            currency: currencyId
        });

        if (!rankUpConversion || !divisionConversion) {
            throw new CustomError('Conversión de precio no encontrada para la moneda seleccionada', 404);
        }

        // Crear la nueva orden
        const newOrder = new EloBoostOrder({
            user: userId || '000000000000000000000000', // Usar un ID temporal si no hay usuario
            currentRank: {
                rank: currentRankId,
                division: currentDivision
            },
            targetRank: {
                rank: targetRankId,
                division: targetDivision
            },
            queueType: queueType || 'solo',
            specificRole: {
                selected: specificRole || false,
                role: specificRoleValue || ''
            },
            specificChampion: {
                selected: specificChampion || false,
                champion: specificChampionId || null
            },
            duoQueue: duoQueue || false,
            // Valores en RP
            baseRPPrice,
            totalRPPrice,
            additionalRPCost: additionalRPCost || 0,
            // Valores convertidos a moneda local
            currency: currencyId,
            basePrice,
            totalPrice,
            additionalCost: additionalCost || 0,
            status: 'pending_payment'
        });

        await newOrder.save();

        res.status(201).json({
            message: 'Orden de EloBoost creada exitosamente',
            order: newOrder
        });
    } catch (error) {
        next(error);
    }
}

// Función para actualizar los detalles de la cuenta en cualquier punto del proceso
async function updateAccountDetails(req, res, next) {
    try {
        const { orderId } = req.params;
        const { username, password, userId: bodyUserId } = req.body;
        const userId = bodyUserId || (req.user && req.user._id);

        // Validar datos requeridos SOLO si no es duo queue
        const order = await EloBoostOrder.findOne({ _id: orderId });
        
        if (!order) {
            throw new CustomError('Orden no encontrada', 404);
        }
        
        // Si no es duo queue, validar que haya credenciales
        if (!order.duoQueue && (!username || !password)) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Se requieren usuario y contraseña de la cuenta para órdenes no duo'
            );
        }
        
        // Si es duo queue, no se requieren credenciales
        if (order.duoQueue) {
            return res.status(200).json({
                success: true,
                message: 'No se requieren credenciales para órdenes duo queue'
            });
        }

        // Verificar que el usuario sea el dueño de la orden
        if (userId && order.user.toString() !== userId.toString()) {
            throw new CustomError('No autorizado', 403, 'No tienes permiso para actualizar esta orden');
        }

        // Permitimos actualizar las credenciales independientemente del estado de la orden
        // pero registramos si está en un estado inusual
        if (order.status !== 'pending_payment' && order.status !== 'pending_account') {
            console.log(`Advertencia: Actualizando credenciales de cuenta para orden ${orderId} en estado ${order.status}`);
        }

        // Encriptar los detalles de la cuenta
        const encryptedUsername = encrypt(username);
        const encryptedPassword = encrypt(password);

        // Actualizar la orden
        order.accountDetails = {
            username: encryptedUsername,
            password: encryptedPassword,
            provided: true
        };
        
        // Solo cambiamos el estado si estaba en pending_account
        if (order.status === 'pending_account') {
            order.status = 'processing';
        }

        await order.save();

        res.status(200).json({
            message: 'Detalles de cuenta actualizados correctamente',
            status: order.status
        });
    } catch (error) {
        next(error);
    }
}

// Función para obtener órdenes de un usuario
async function getUserEloBoostOrders(req, res, next) {
    try {
        const userId = req.query.userId || (req.user && req.user._id);
        
        if (!userId) {
            return res.status(200).json([]); // Si no hay userId, devolvemos un array vacío
        }

        const orders = await EloBoostOrder.find({ user: userId })
            .populate({
                path: 'currentRank.rank',
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate({
                path: 'targetRank.rank',
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate('specificChampion.champion', 'name icon')
            .populate('payment', 'status paymentMethod receipt riotName discordName region')
            .populate('currency', 'name symbol code')
            .sort({ createdAt: -1 });

        // Eliminar información sensible
        const sanitizedOrders = orders.map(order => {
            const orderObj = order.toObject();
            if (orderObj.accountDetails) {
                delete orderObj.accountDetails.username;
                delete orderObj.accountDetails.password;
            }
            return orderObj;
        });

        res.status(200).json(sanitizedOrders);
    } catch (error) {
        next(error);
    }
}

// Función para obtener una orden específica
async function getEloBoostOrderById(req, res, next) {
    try {
        const { orderId } = req.params;
        const userId = req.query.userId || (req.user && req.user._id);

        // Para facilitar el flujo de checkout, permitimos buscar órdenes solo por ID
        // si no se proporciona userId (solo aplicable al endpoint público)
        const query = { _id: orderId };
        
        // Solo filtramos por usuario si se proporciona uno
        if (userId && req.path.includes('/my-orders/')) {
            query.user = userId;
        }

        const order = await EloBoostOrder.findOne(query)
            .populate({
                path: 'currentRank.rank', 
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate({
                path: 'targetRank.rank',
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate('specificChampion.champion', 'name icon')
            .populate('payment', 'status paymentMethod receipt riotName discordName region')
            .populate('currency', 'name symbol code');

        if (!order) {
            throw new CustomError('Orden no encontrada', 404);
        }

        // Eliminar información sensible
        const orderObj = order.toObject();
        if (orderObj.accountDetails) {
            delete orderObj.accountDetails.username;
            delete orderObj.accountDetails.password;
        }

        res.status(200).json(orderObj);
    } catch (error) {
        next(error);
    }
}

// Función para que los administradores obtengan todas las órdenes
async function getAllEloBoostOrders(req, res, next) {
    try {
        // Parámetros de filtrado opcionales
        const { status, userId, startDate, endDate, currencyId } = req.query;
        
        // Construir filtro
        const filter = {};
        
        if (status) {
            filter.status = status;
        }
        
        if (userId) {
            filter.user = userId;
        }
        
        if (currencyId) {
            filter.currency = currencyId;
        }
        
        // Filtro por fechas
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateObj = new Date(endDate);
                endDateObj.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDateObj;
            }
        }

        const orders = await EloBoostOrder.find(filter)
            .populate('user', 'username email')
            .populate({
                path: 'currentRank.rank',
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate({
                path: 'targetRank.rank',
                select: 'name icon',
                populate: {
                    path: 'rankUpPriceRP divisionPriceRP',
                    model: 'RPPrice'
                }
            })
            .populate('specificChampion.champion', 'name icon')
            .populate('payment', 'status paymentMethod receipt riotName discordName region')
            .populate('currency', 'name symbol code')
            .sort({ createdAt: -1 });

        // Desencriptar información de la cuenta solo para administradores
        const decryptedOrders = orders.map(order => {
            const orderObj = order.toObject();
            
            // Solo desencriptar si la cuenta ha sido proporcionada
            if (orderObj.accountDetails && orderObj.accountDetails.provided) {
                try {
                    orderObj.accountDetails.username = decrypt(orderObj.accountDetails.username);
                    orderObj.accountDetails.password = decrypt(orderObj.accountDetails.password);
                } catch (error) {
                    console.error('Error desencriptando datos de cuenta:', error);
                    orderObj.accountDetails.username = '[Error de desencriptación]';
                    orderObj.accountDetails.password = '[Error de desencriptación]';
                }
            }
            
            return orderObj;
        });

        res.status(200).json(decryptedOrders);
    } catch (error) {
        next(error);
    }
}

// Función para actualizar el estado de una orden (solo administradores)
async function updateEloBoostOrderStatus(req, res, next) {
    try {
        const { orderId } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            throw new CustomError('Estado no proporcionado', 400);
        }

        const order = await EloBoostOrder.findById(orderId);
        if (!order) {
            throw new CustomError('Orden no encontrada', 404);
        }

        // Validación especial para órdenes duo
        if (order.duoQueue && (order.status === 'pending_payment' || order.status === 'payment_confirmed')) {
            // Si es una orden duo y se está pasando de pending_payment o payment_confirmed
            // debe ir a pending_duo_confirmation, no directamente a processing
            if (status === 'processing' || status === 'pending_account') {
                throw new CustomError(
                    'Las órdenes duo deben pasar por confirmación del usuario antes de procesarse',
                    400
                );
            }
        }

        // Actualizar estado
        order.status = status;
        
        // Actualizar notas si se proporcionan
        if (notes) {
            order.notes = notes;
        }
        
        // Actualizar fechas según el estado
        if (status === 'processing') {
            // Establecer la fecha de inicio independientemente de si ya tenía una
            order.startDate = new Date();
            console.log(`Actualizando fecha de inicio para orden ${orderId}: ${order.startDate}`);
        } else if (status === 'completed') {
            // Establecer la fecha de finalización independientemente de si ya tenía una
            order.completionDate = new Date();
            console.log(`Actualizando fecha de finalización para orden ${orderId}: ${order.completionDate}`);
        }

        // Asegurarnos de que los valores no sean null (esto podría ocurrir si las fechas se formatearon incorrectamente)
        if (order.startDate === null || order.startDate === undefined) {
            order.startDate = status === 'processing' ? new Date() : null;
        }
        
        if (order.completionDate === null || order.completionDate === undefined) {
            order.completionDate = status === 'completed' ? new Date() : null;
        }

        const updatedOrder = await order.save();

        // Verificar que las fechas se guardaron correctamente
        console.log('Orden actualizada con fechas:', {
            id: updatedOrder._id,
            status: updatedOrder.status,
            startDate: updatedOrder.startDate,
            completionDate: updatedOrder.completionDate
        });

        res.status(200).json({
            message: 'Estado de orden actualizado correctamente',
            order: updatedOrder
        });
    } catch (error) {
        next(error);
    }
}

// Asociar una orden de Elo Boost con un pago
async function linkEloBoostOrderToPayment(req, res, next) {
    try {
        // Determinar si estamos manejando una carga de recibo o solo una asociación de pago
        const isReceiptUpload = req.file && req.params.orderId;
        const orderId = isReceiptUpload ? req.params.orderId : req.body.orderId;
        const paymentId = req.body.paymentId;

        if (!orderId) {
            throw new CustomError('ID de orden no proporcionado', 400);
        }

        // Si es una carga de recibo, verificar que el archivo se haya proporcionado
        if (isReceiptUpload && !req.file) {
            throw new CustomError('No se proporcionó el archivo de recibo', 400);
        }

        const order = await EloBoostOrder.findById(orderId);
        if (!order) {
            throw new CustomError('Orden no encontrada', 404);
        }

        // Manejar la carga del recibo si existe
        if (isReceiptUpload) {
            await ensureReceiptsDir();
            
            // Si estamos actualizando una orden con un pago existente
            if (order.payment) {
                // Importar el modelo de Compra para actualizar el recibo
                const Purchase = require('../database/Models/purcharseModel');
                const purchase = await Purchase.findById(order.payment);
                
                if (purchase) {
                    // Actualizar el recibo en el registro de pago existente
                    purchase.receipt = req.file.filename;
                    await purchase.save();
                    
                    // Mover el archivo al directorio de recibos
                    const uploadPath = path.join(receiptsDir, req.file.filename);
                    await fs.rename(req.file.path, uploadPath);
                    
                    res.status(200).json({
                        message: 'Recibo actualizado correctamente para la orden de Elo Boost',
                        order,
                        receipt: req.file.filename
                    });
                    return;
                }
            }
            
            // Si no hay pago existente o no se encontró, crear uno nuevo
            if (!paymentId) {
                // Crear un nuevo registro de pago con el recibo
                const Purchase = require('../database/Models/purcharseModel');
                const Status = require('../database/Models/statusModel');
                
                // Buscar estado por defecto
                const defaultStatus = await Status.findOne({ default: true });
                if (!defaultStatus) {
                    throw new CustomError('No se encontró un status por defecto', 500);
                }
                
                // Crear nuevo pago
                const newPurchase = new Purchase({
                    userId: order.user,
                    receipt: req.file.filename,
                    riotName: order.riotName || 'Sin nombre',
                    discordName: order.discordName || 'Sin Discord',
                    region: order.server || 'LAN',
                    Total: order.totalPrice,
                    originalPrice: order.totalPrice,
                    discountAmount: 0,
                    status: {
                        statusId: defaultStatus._id,
                        estadoConfirmado: false,
                        confirmadoEn: null
                    },
                    currencyId: order.currency,
                    orderType: 'eloboost'
                });
                
                await newPurchase.save();
                
                // Mover el archivo al directorio de recibos
                const uploadPath = path.join(receiptsDir, req.file.filename);
                await fs.rename(req.file.path, uploadPath);
                
                // Asociar el pago pero mantener el estado en "pending_payment" para que el admin confirme
                // Esto permite que el admin revise el comprobante antes de confirmar
                order.payment = newPurchase._id;
                
                // Mantenemos el estado como "pending_payment" para revisión del admin
                // El admin debe confirmar manualmente el pago después de verificar el comprobante
                order.status = 'pending_payment';
                
                await order.save();
                
                res.status(200).json({
                    message: 'Recibo cargado y pago creado correctamente para la orden de Elo Boost',
                    order,
                    receipt: req.file.filename
                });
                return;
            }
        }

        // Caso típico: solo asociar un pago existente
        if (!paymentId) {
            throw new CustomError('ID de pago no proporcionado', 400);
        }

        // Asociar el pago pero mantener el estado en "pending_payment" para que el admin confirme
        // Esto permite que el admin revise el comprobante antes de confirmar el pago
        order.payment = paymentId;
        
        // Mantenemos el estado como "pending_payment" para revisión del admin
        // El admin debe confirmar manualmente después de verificar el comprobante
        order.status = 'pending_payment';
        
        await order.save();

        res.status(200).json({
            message: 'Pago asociado correctamente a la orden de Elo Boost',
            order
        });
    } catch (error) {
        next(error);
    }
}

// Estadísticas de Elo Boost para el panel de administración
async function getEloBoostStats(req, res, next) {
    try {
        // Filtro de moneda opcional
        const { currencyId } = req.query;
        const filter = {};
        
        if (currencyId) {
            filter.currency = currencyId;
        }
        
        // Total de órdenes
        const totalOrders = await EloBoostOrder.countDocuments(filter);
        
        // Órdenes por estado
        const ordersByStatus = await EloBoostOrder.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        // Ingresos totales (excluyendo cancelados y pendientes de pago)
        const totalRevenue = await EloBoostOrder.aggregate([
            {
                $match: { 
                    ...filter,
                    status: { $nin: ['cancelled', 'pending_payment'] }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalPrice' }
                }
            }
        ]);
        
        // Órdenes recientes (últimos 5)
        const recentOrders = await EloBoostOrder.find(filter)
            .populate('user', 'username')
            .populate('currentRank.rank', 'name')
            .populate('targetRank.rank', 'name')
            .populate('currency', 'name symbol code')
            .sort({ createdAt: -1 })
            .limit(5);
            
        // Órdenes por mes (últimos 6 meses)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const ordersByMonth = await EloBoostOrder.aggregate([
            {
                $match: {
                    ...filter,
                    createdAt: { $gte: sixMonthsAgo }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' }
                    },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: {
                    '_id.year': 1,
                    '_id.month': 1
                }
            }
        ]);
        
        // Top rangos solicitados
        const topTargetRanks = await EloBoostOrder.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'eloboostranks',
                    localField: 'targetRank.rank',
                    foreignField: '_id',
                    as: 'rankInfo'
                }
            },
            {
                $unwind: '$rankInfo'
            },
            {
                $group: {
                    _id: {
                        rankId: '$targetRank.rank',
                        rankName: '$rankInfo.name',
                        division: '$targetRank.division'
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);
        
        // Detalle de moneda si se filtró por una
        let currencyDetails = null;
        if (currencyId) {
            currencyDetails = await Currency.findById(currencyId, 'name symbol code');
        }

        res.status(200).json({
            totalOrders,
            ordersByStatus,
            totalRevenue: totalRevenue[0]?.total || 0,
            recentOrders,
            ordersByMonth,
            topTargetRanks,
            currency: currencyDetails
        });
    } catch (error) {
        next(error);
    }
}

// Función para obtener las conversiones de precios RP para EloBoost
async function getEloBoostPriceConversions(req, res, next) {
    try {
        // Obtener todos los rangos disponibles
        const ranks = await EloBoostRank.find({ active: true })
            .populate('rankUpPriceRP')
            .populate('divisionPriceRP')
            .sort({ order: 1 });
            
        // Recorremos los rangos para obtener los IDs de precios RP únicos
        const rpPriceIds = new Set();
        ranks.forEach(rank => {
            if (rank.rankUpPriceRP) rpPriceIds.add(rank.rankUpPriceRP._id.toString());
            if (rank.divisionPriceRP) rpPriceIds.add(rank.divisionPriceRP._id.toString());
        });
        
        // Obtener todas las monedas activas
        const currencies = await Currency.find({ active: true });
        
        // Para cada moneda, obtener conversiones para todos los precios RP
        const priceConversions = {};
        
        for (const currency of currencies) {
            const currencyId = currency._id.toString();
            priceConversions[currencyId] = {
                currency: {
                    _id: currency._id,
                    name: currency.name,
                    code: currency.code,
                    symbol: currency.symbol
                },
                conversions: {}
            };
            
            // Obtener todas las conversiones para esta moneda y los precios RP
            for (const rpPriceId of rpPriceIds) {
                const conversion = await RPPriceConversion.findOne({
                    rpPrice: rpPriceId,
                    currency: currencyId
                }).populate('rpPrice');
                
                if (conversion) {
                    priceConversions[currencyId].conversions[rpPriceId] = {
                        rpPrice: conversion.rpPrice,
                        priceSeguro: conversion.priceSeguro,
                        priceBarato: conversion.priceBarato
                    };
                }
            }
        }
        
        res.status(200).json({
            currencies: currencies.map(c => ({ 
                _id: c._id, 
                name: c.name, 
                code: c.code,
                symbol: c.symbol
            })),
            conversions: priceConversions
        });
    } catch (error) {
        next(error);
    }
}

// Confirmar solicitud de duo por parte del usuario
async function confirmDuoRequest(req, res, next) {
    try {
        const { orderId } = req.params;
        const userId = req.user?._id;

        if (!orderId) {
            throw new CustomError('ID de orden no proporcionado', 400);
        }

        const order = await EloBoostOrder.findOne({ _id: orderId, user: userId });

        if (!order) {
            throw new CustomError('Orden no encontrada', 404);
        }

        // Verificar que la orden sea de duo queue
        if (!order.duoQueue) {
            throw new CustomError('Esta orden no es de tipo duo queue', 400);
        }

        // Verificar que esté en el estado correcto
        if (order.status !== 'pending_duo_confirmation') {
            throw new CustomError('La orden no está en estado de confirmación pendiente', 400);
        }

        // Actualizar la confirmación
        order.duoConfirmation = {
            confirmed: true,
            confirmedAt: new Date()
        };
        order.status = 'processing';

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Solicitud de duo confirmada exitosamente',
            order: {
                id: order._id,
                status: order.status,
                duoConfirmation: order.duoConfirmation
            }
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createEloBoostOrder,
    updateAccountDetails,
    getUserEloBoostOrders,
    getEloBoostOrderById,
    getAllEloBoostOrders,
    updateEloBoostOrderStatus,
    linkEloBoostOrderToPayment,
    getEloBoostStats,
    getEloBoostPriceConversions,
    confirmDuoRequest
};
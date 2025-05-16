const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');
const uploadRankIcon = require('../middlewares/uploadRankIcon');
const uploadReceipt = require('../middlewares/multerConfig'); // Importar el middleware para subir recibos

// Importar controladores
const {
    getAllEloBoostRanks,
    createEloBoostRank,
    updateEloBoostRank,
    deleteEloBoostRank,
    calculateBoostCost
} = require('../controllers/eloBoostRankController');

const {
    getEloBoostConfig,
    updateEloBoostConfig,
    getAvailableChampions
} = require('../controllers/eloBoostConfigController');

const {
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
} = require('../controllers/eloBoostOrderController');

// Importar controlador de RPPriceConversion
const { 
    convertRPtoCurrency 
} = require('../controllers/rpPriceConversionController');

// ===== Rutas para Rangos de EloBoost =====
// Rutas públicas (accesibles sin autenticación)
router.get('/ranks', getAllEloBoostRanks);
router.post('/calculate', calculateBoostCost);
router.post('/price-conversion', convertRPtoCurrency); // Ruta para conversión de precios individual
router.get('/price-conversions', getEloBoostPriceConversions); // Nueva ruta para obtener todas las conversiones de precios de EloBoost
router.get('/orders/:orderId', getEloBoostOrderById); // Ruta pública para obtener orden por ID

// Rutas que requieren autenticación de administrador
router.post('/ranks', [verifyToken, isAdmin], uploadRankIcon.single('icon'), createEloBoostRank);
router.put('/ranks/:id', [verifyToken, isAdmin], uploadRankIcon.single('icon'), updateEloBoostRank);
router.delete('/ranks/:id', [verifyToken, isAdmin], deleteEloBoostRank);

// ===== Rutas para Configuración de EloBoost =====
// Ruta pública para obtener configuración
router.get('/config', getEloBoostConfig);
router.get('/champions', getAvailableChampions);

// Ruta para actualizar configuración (solo admin)
router.put('/config', [verifyToken, isAdmin], updateEloBoostConfig);

// ===== Rutas para Órdenes de EloBoost =====
// Crear una orden (requiere autenticación)
router.post('/orders', verifyToken, createEloBoostOrder);

// Actualizar detalles de cuenta (usuario autenticado)
router.put('/orders/:orderId/account', verifyToken, updateAccountDetails);

// Confirmar solicitud de duo (usuario autenticado)
router.post('/orders/:orderId/confirm-duo', verifyToken, confirmDuoRequest);

// Obtener órdenes del usuario actual
router.get('/my-orders', verifyToken, getUserEloBoostOrders);
router.get('/my-orders/:orderId', verifyToken, getEloBoostOrderById);

// Rutas de administración (solo admin)
router.get('/orders', [verifyToken, isAdmin], getAllEloBoostOrders);
router.put('/orders/:orderId/status', [verifyToken, isAdmin], updateEloBoostOrderStatus);
router.post('/orders/link-payment', [verifyToken, isAdmin], linkEloBoostOrderToPayment);
// Esta ruta ya no es necesaria, ya que los recibos se gestionan a través del proceso de compra
router.get('/stats', [verifyToken, isAdmin], getEloBoostStats);

module.exports = router;
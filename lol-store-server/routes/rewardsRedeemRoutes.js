const express = require('express');
const { 
    createRedeem,
    getAllRedeems,
    getUserRedeems,
    updateRedeem,
    deleteRedeem,
    getUnreadRedeems,
    markStatusAsViewed,
    getUnreadCount,
    confirmRedeemStatus
} = require('../controllers/rewardRedeemController');

const router = express.Router();

// Rutas básicas de CRUD
router.post('/create', createRedeem);
router.get('/getAll', getAllRedeems);
router.get('/user/:userId', getUserRedeems);
router.put('/edit/:id', updateRedeem);
router.delete('/delete/:id', deleteRedeem);

// Rutas de gestión de estados
router.get('/unread/:userId', getUnreadRedeems);
router.put('/markViewed/:redeemId', markStatusAsViewed);
router.get('/unreadCount/:userId', getUnreadCount);
router.post('/confirm/:redeemId', confirmRedeemStatus);

module.exports = router;
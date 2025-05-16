const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// Ruta para obtener estadísticas del dashboard
router.get('/stats', dashboardController.getDashboardStats);

module.exports = router;
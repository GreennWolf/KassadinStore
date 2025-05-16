/**
 * Rutas para el seguimiento de progreso de tareas asíncronas
 */

const express = require('express');
const router = express.Router();
const { getJobInfo, getAllJobs, cancelJob } = require('../controllers/progressController');

// Obtener información de un trabajo específico
router.get('/jobs/:jobId', getJobInfo);

// Obtener todos los trabajos activos
router.get('/jobs', getAllJobs);

// Cancelar un trabajo
router.post('/jobs/:jobId/cancel', cancelJob);

module.exports = router;
/**
 * Controlador para gestionar las operaciones relacionadas con el progreso
 */

const progressService = require('../services/progressService');

/**
 * Obtiene información sobre un trabajo en progreso
 */
async function getJobInfo(req, res, next) {
  try {
    const { jobId } = req.params;
    const jobInfo = progressService.getJobInfo(jobId);
    
    if (!jobInfo) {
      return res.status(404).json({
        success: false,
        message: 'Trabajo no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: jobInfo
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtiene todos los trabajos activos
 */
async function getAllJobs(req, res, next) {
  try {
    const jobs = progressService.getAllJobs();
    
    res.json({
      success: true,
      count: jobs.length,
      data: jobs
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancela un trabajo en progreso (si es posible)
 * Nota: Esta funcionalidad dependerá de la capacidad de cada tarea para ser cancelada
 */
async function cancelJob(req, res, next) {
  try {
    const { jobId } = req.params;
    const jobInfo = progressService.getJobInfo(jobId);
    
    if (!jobInfo) {
      return res.status(404).json({
        success: false,
        message: 'Trabajo no encontrado'
      });
    }
    
    // Actualmente no tenemos un mecanismo de cancelación
    // pero podemos marcar el trabajo como fallido
    progressService.failJob(jobId, new Error('Trabajo cancelado por el usuario'));
    
    res.json({
      success: true,
      message: 'Trabajo marcado para cancelación'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getJobInfo,
  getAllJobs,
  cancelJob
};
/**
 * Servicio para el manejo del progreso de tareas asíncronas largas
 * Este servicio permite rastrear el progreso de operaciones como scraping
 * y proporciona mecanismos para reportar ese progreso a través de WebSockets
 */

const { v4: uuidv4 } = require('uuid');

// Almacén en memoria para el estado de los trabajos
const jobsStore = new Map();

/**
 * Estructura de un trabajo de progreso:
 * {
 *   id: string,               // Identificador único del trabajo
 *   description: string,      // Descripción del trabajo
 *   currentStep: number,      // Paso actual (de 0 a totalSteps)
 *   totalSteps: number,       // Total de pasos
 *   percentage: number,       // Porcentaje de progreso (0-100)
 *   startTime: Date,          // Tiempo de inicio
 *   estimatedEndTime: Date,   // Tiempo estimado de finalización
 *   currentStepDescription: string, // Descripción del paso actual
 *   status: 'pending'|'running'|'completed'|'failed', // Estado del trabajo
 *   result: any,              // Resultado del trabajo cuando se completa
 *   error: Error,             // Error si el trabajo falla
 *   logs: Array               // Registro de actividades (para debugging)
 * }
 */

/**
 * Crea un nuevo trabajo de progreso
 * @param {string} description - Descripción del trabajo
 * @param {number} totalSteps - Número total de pasos
 * @returns {string} ID del trabajo
 */
function createJob(description, totalSteps) {
  const jobId = uuidv4();
  const job = {
    id: jobId,
    description,
    currentStep: 0,
    totalSteps,
    percentage: 0,
    startTime: new Date(),
    estimatedEndTime: null,
    currentStepDescription: 'Iniciando...',
    status: 'pending',
    result: null,
    error: null,
    logs: []
  };
  
  jobsStore.set(jobId, job);
  return jobId;
}

/**
 * Inicia un trabajo existente
 * @param {string} jobId - ID del trabajo
 * @returns {boolean} True si el trabajo existe y fue iniciado
 */
function startJob(jobId) {
  const job = jobsStore.get(jobId);
  if (!job) return false;
  
  job.status = 'running';
  job.startTime = new Date();
  // Estimación inicial (será actualizada a medida que avance)
  job.estimatedEndTime = new Date(job.startTime.getTime() + (1000 * 60 * 5)); // +5 min por defecto
  
  job.logs.push({
    time: new Date(),
    message: `Trabajo iniciado: ${job.description}`
  });
  
  return true;
}

/**
 * Actualiza el progreso de un trabajo
 * @param {string} jobId - ID del trabajo
 * @param {number} step - Paso actual
 * @param {string} stepDescription - Descripción del paso actual
 * @returns {object|null} Información actualizada del trabajo o null si no existe
 */
function updateProgress(jobId, step, stepDescription) {
  const job = jobsStore.get(jobId);
  if (!job) return null;
  
  // Actualizar paso actual
  job.currentStep = step;
  job.currentStepDescription = stepDescription;
  
  // Calcular porcentaje
  job.percentage = Math.min(Math.floor((step / job.totalSteps) * 100), 99);
  
  // Actualizar tiempo estimado basado en el progreso actual
  if (job.currentStep > 0) {
    const elapsedTime = new Date().getTime() - job.startTime.getTime();
    const timePerStep = elapsedTime / job.currentStep;
    const remainingSteps = job.totalSteps - job.currentStep;
    const estimatedRemainingTime = timePerStep * remainingSteps;
    
    job.estimatedEndTime = new Date(Date.now() + estimatedRemainingTime);
  }
  
  // Registrar progreso en logs
  job.logs.push({
    time: new Date(),
    message: `Progreso ${job.percentage}%: ${stepDescription}`
  });
  
  return { ...job };
}

/**
 * Completa un trabajo
 * @param {string} jobId - ID del trabajo
 * @param {any} result - Resultado del trabajo
 * @returns {boolean} True si el trabajo existe y fue completado
 */
function completeJob(jobId, result) {
  const job = jobsStore.get(jobId);
  if (!job) return false;
  
  job.status = 'completed';
  job.currentStep = job.totalSteps;
  job.percentage = 100;
  job.result = result;
  job.estimatedEndTime = new Date();
  
  job.logs.push({
    time: new Date(),
    message: `Trabajo completado: ${job.description}`
  });
  
  // Establecer un temporizador para eliminar el trabajo después de 1 hora
  setTimeout(() => {
    jobsStore.delete(jobId);
  }, 1000 * 60 * 60);
  
  return true;
}

/**
 * Marca un trabajo como fallido
 * @param {string} jobId - ID del trabajo
 * @param {Error} error - Error que causó la falla
 * @returns {boolean} True si el trabajo existe y fue marcado como fallido
 */
function failJob(jobId, error) {
  const job = jobsStore.get(jobId);
  if (!job) return false;
  
  job.status = 'failed';
  job.error = {
    message: error.message,
    stack: error.stack
  };
  
  job.logs.push({
    time: new Date(),
    message: `Trabajo fallido: ${error.message}`
  });
  
  // Establecer un temporizador para eliminar el trabajo después de 1 hora
  setTimeout(() => {
    jobsStore.delete(jobId);
  }, 1000 * 60 * 60);
  
  return true;
}

/**
 * Obtiene la información de un trabajo
 * @param {string} jobId - ID del trabajo
 * @returns {object|null} Información del trabajo o null si no existe
 */
function getJobInfo(jobId) {
  const job = jobsStore.get(jobId);
  if (!job) return null;
  
  // Devolver copia para evitar modificaciones externas
  return { ...job };
}

/**
 * Obtiene todos los trabajos activos
 * @returns {Array} Lista de trabajos
 */
function getAllJobs() {
  return Array.from(jobsStore.values()).map(job => ({ ...job }));
}

module.exports = {
  createJob,
  startJob,
  updateProgress,
  completeJob,
  failJob,
  getJobInfo,
  getAllJobs
};
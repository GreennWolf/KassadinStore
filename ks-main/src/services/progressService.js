// services/progressService.js
import axios from 'axios';

// Define la URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

/**
 * Inicia una tarea de scraping completo
 * @returns {Promise<Object>} - Respuesta con ID de la tarea
 */
export const startScraping = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scrape`);
    return response.data;
  } catch (error) {
    console.error('Error al iniciar el scraping:', error);
    throw error;
  }
};

/**
 * Inicia una tarea de actualización de iconos de campeones
 * @returns {Promise<Object>} - Respuesta con ID de la tarea
 */
export const startChampionIconsUpdate = async () => {
  try {
    const response = await axios.post(`${API_BASE_URL}/scrape-champion-icons`);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar iconos de campeones:', error);
    throw error;
  }
};

/**
 * Actualiza iconos de campeones específicos
 * @param {Array<string>} champions - Lista de nombres de campeones
 * @returns {Promise<Object>} - Respuesta con ID de la tarea
 */
export const updateMissingChampionIcons = async (champions) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update-missing-champions`, { champions });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar iconos específicos:', error);
    throw error;
  }
};

/**
 * Obtiene información sobre el estado actual de una tarea
 * @param {string} jobId - ID de la tarea
 * @returns {Promise<Object>} - Información de la tarea
 */
export const getJobInfo = async (jobId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/progress/jobs/${jobId}`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener información de la tarea:', error);
    throw error;
  }
};

/**
 * Obtiene todas las tareas en progreso
 * @returns {Promise<Array>} - Lista de tareas
 */
export const getAllJobs = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/progress/jobs`);
    return response.data.data;
  } catch (error) {
    console.error('Error al obtener todas las tareas:', error);
    throw error;
  }
};

/**
 * Intenta cancelar una tarea en progreso
 * @param {string} jobId - ID de la tarea
 * @returns {Promise<Object>} - Resultado de la cancelación
 */
export const cancelJob = async (jobId) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/progress/jobs/${jobId}/cancel`);
    return response.data;
  } catch (error) {
    console.error('Error al cancelar la tarea:', error);
    throw error;
  }
};

/**
 * Inicia el monitoreo del progreso de una tarea mediante polling
 * @param {string} jobId - ID de la tarea a monitorear
 * @param {Object} callbacks - Funciones de callback para eventos de progreso
 * @returns {Object} - Objeto con función para detener el monitoreo
 */
export const monitorJobProgress = (jobId, callbacks = {}) => {
  let intervalId = null;
  let stopped = false;
  
  // Iniciar polling
  const startPolling = () => {
    if (intervalId) clearInterval(intervalId);
    
    // Consultar cada 2 segundos
    intervalId = setInterval(async () => {
      if (stopped) return;
      
      try {
        const jobInfo = await getJobInfo(jobId);
        
        // Si hay callback de progreso, ejecutarlo con la información
        if (callbacks.onProgress) {
          callbacks.onProgress(jobInfo);
        }
        
        // Si el trabajo ha completado
        if (jobInfo.status === 'completed') {
          if (callbacks.onCompleted) {
            callbacks.onCompleted({ 
              jobId, 
              result: jobInfo.result 
            });
          }
          
          // Detener polling
          stopPolling();
        }
        
        // Si el trabajo ha fallado
        if (jobInfo.status === 'failed') {
          if (callbacks.onFailed) {
            callbacks.onFailed({ 
              jobId, 
              error: jobInfo.error 
            });
          }
          
          // Detener polling
          stopPolling();
        }
      } catch (error) {
        console.error('Error durante el polling de progreso:', error);
        
        // Intentar un máximo de 3 veces en caso de error, luego detener
        if (error.retryCount >= 3) {
          stopPolling();
          
          if (callbacks.onFailed) {
            callbacks.onFailed({
              jobId,
              error: {
                message: 'Error al obtener información del progreso'
              }
            });
          }
        } else {
          error.retryCount = (error.retryCount || 0) + 1;
        }
      }
    }, 2000); // Consultar cada 2 segundos
  };
  
  // Detener polling
  const stopPolling = () => {
    stopped = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
  
  // Iniciar inmediatamente
  startPolling();
  
  // Devolver objeto para controlar el polling
  return {
    stop: stopPolling
  };
};

export default {
  startScraping,
  startChampionIconsUpdate,
  updateMissingChampionIcons,
  getJobInfo,
  getAllJobs,
  cancelJob,
  monitorJobProgress
};
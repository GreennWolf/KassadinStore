import axios from 'axios';


const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/xp-convertions`;

/**
 * Crear una nueva conversión de XP
 * @param {Object} conversionData - Datos de la conversión (xpAmount, currency, currencyAmount)
 * @returns {Promise} Respuesta del servidor
 */
export const createXpConvertion = async (conversionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/`, conversionData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al crear la conversión de XP');
        throw error;
    }
};

/**
 * Obtener todas las conversiones de XP
 * @returns {Promise} Lista de conversiones de XP
 */
export const getAllXpConvertions = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al obtener las conversiones de XP');
        throw error;
    }
};

/**
 * Actualizar una conversión de XP
 * @param {string} id - ID de la conversión
 * @param {Object} conversionData - Datos actualizados de la conversión
 * @returns {Promise} Respuesta del servidor
 */
export const updateXpConvertion = async (id, conversionData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, conversionData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al actualizar la conversión de XP');
        throw error;
    }
};

/**
 * Eliminar una conversión de XP
 * @param {string} id - ID de la conversión a eliminar
 * @returns {Promise} Respuesta del servidor
 */
export const deleteXpConvertion = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar la conversión de XP');
        throw error;
    }
};

const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.response) {
        throw new Error(error.response.data.message || defaultMessage);
    } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
    } else {
        throw new Error(error.message || defaultMessage);
    }
};

// Ejemplo de uso para crear una conversión de XP
export const createXpConvertionExample = () => {
    const conversionData = {
        xpAmount: 100,
        currency: 'currency_id_here',
        currencyAmount: 50
    };
    return createXpConvertion(conversionData);
};

export default {
    createXpConvertion,
    getAllXpConvertions,
    updateXpConvertion,
    deleteXpConvertion
};
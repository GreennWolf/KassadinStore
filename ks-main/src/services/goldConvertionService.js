import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/gold-convertions`;

/**
 * Crear una nueva conversión de oro
 * @param {Object} conversionData - Datos de la conversión (gold, rpPrice)
 * @returns {Promise} Respuesta del servidor
 */
export const createGoldConvertion = async (conversionData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/`, conversionData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al crear la conversión de oro');
        throw error;
    }
};

/**
 * Obtener todas las conversiones de oro
 * @returns {Promise} Lista de conversiones de oro
 */
export const getAllGoldConvertions = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al obtener las conversiones de oro');
        throw error;
    }
};

/**
 * Actualizar una conversión de oro
 * @param {string} id - ID de la conversión
 * @param {Object} conversionData - Datos actualizados de la conversión
 * @returns {Promise} Respuesta del servidor
 */
export const updateGoldConvertion = async (id, conversionData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, conversionData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al actualizar la conversión de oro');
        throw error;
    }
};

/**
 * Eliminar una conversión de oro
 * @param {string} id - ID de la conversión a eliminar
 * @returns {Promise} Respuesta del servidor
 */
export const deleteGoldConvertion = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar la conversión de oro');
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

// Ejemplo de uso para crear una conversión de oro
export const createGoldConvertionExample = () => {
    const conversionData = {
        gold: 100,
        rpPrice: 'rpPrice_id_here'
    };
    return createGoldConvertion(conversionData);
};

export default {
    createGoldConvertion,
    getAllGoldConvertions,
    updateGoldConvertion,
    deleteGoldConvertion
};
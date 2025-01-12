import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/items`;

/**
 * Crear un nuevo precio de RP
 * @param {Object} rpPriceData - Datos del precio de RP
 * @returns {Promise} Respuesta del servidor
 */
export const createRPPrice = async (rpPriceData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rp-price/create`, rpPriceData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al crear el precio de RP');
        throw error;
    }
};

/**
 * Obtener todos los precios de RP
 * @returns {Promise} Lista de precios de RP
 */
export const getAllRpPrice = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rp-price/getAll`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al obtener los precios de RP');
        throw error;
    }
};

/**
 * Actualizar un precio de RP
 * @param {string} id - ID del precio de RP
 * @param {Object} rpPriceData - Datos actualizados del precio de RP
 * @returns {Promise} Respuesta del servidor
 */
export const updateRpPrice = async (id, rpPriceData) => {
    // console.log(rpPriceData)
    try {
        const response = await axios.put(`${API_BASE_URL}/rp-price/update/${id}`, rpPriceData);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al actualizar el precio de RP');
        throw error;
    }
};

/**
 * Eliminar un precio de RP
 * @param {string} id - ID del precio de RP a eliminar
 * @returns {Promise} Respuesta del servidor
 */
export const deleteRpPrice = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/rp-price/delete/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar el precio de RP');
        throw error;
    }
};

export const activeRpPrice = async (id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/rp-price/active/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar el precio de RP');
        throw error;
    }
};

/**
 * Función auxiliar para manejar errores
 * @param {Error} error - Error capturado
 * @param {string} defaultMessage - Mensaje por defecto
 */
const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.response) {
        // El servidor respondió con un estado fuera del rango 2xx
        throw new Error(error.response.data.message || defaultMessage);
    } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        throw new Error('No se recibió respuesta del servidor');
    } else {
        // Error al configurar la petición
        throw new Error(error.message || defaultMessage);
    }
};


export default {
    createRPPrice,
    getAllRpPrice,
    updateRpPrice,
    deleteRpPrice
};
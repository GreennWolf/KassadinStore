import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/ranks/`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}`

const transformRankUrls = (rank) => {
    if (!rank) return null;
    return {
        ...rank,
        icon: rank.icon ? `${API_BASE_IMAGE}${rank.icon.replace(/\\/g, '/')}` : null
    };
};

const transformRanksArray = (ranks) => {
    if (!Array.isArray(ranks)) return [];
    return ranks.map(transformRankUrls);
};

/**
 * Crear un nuevo rango
 * @param {FormData} rankData - Datos del rango (nombre, xp, oro e icono)
 * @returns {Promise} Respuesta del servidor
 */
export const createRank = async (rankData) => {
    for (let pair of rankData.entries()) {
        // console.log(pair[0] + ': ' + pair[1]);
    }
    
    try {
        const response = await axios.post(`${API_BASE_URL}/`, rankData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return transformRankUrls(response.data);
    } catch (error) {
        handleError(error, 'Error al crear el rango');
        throw error;
    }
};

/**
 * Obtener todos los rangos
 * @returns {Promise} Lista de rangos
 */
export const getAllRanks = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        // console.log(transformRanksArray(response.data))
        return transformRanksArray(response.data);
    } catch (error) {
        handleError(error, 'Error al obtener los rangos');
        throw error;
    }
};

/**
 * Obtener información sobre el siguiente rango
 * @param {number} currentXp - XP actual del usuario
 * @returns {Promise} Información del siguiente rango y XP necesario
 */
export const getNextRank = async (currentXp) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/next/${currentXp}`);
        return {
            ...response.data,
            currentRank: transformRankUrls(response.data.currentRank),
            nextRank: transformRankUrls(response.data.nextRank)
        };
    } catch (error) {
        handleError(error, 'Error al obtener información del siguiente rango');
        throw error;
    }
};

/**
 * Actualizar un rango
 * @param {string} id - ID del rango
 * @param {FormData} rankData - Datos actualizados del rango
 * @returns {Promise} Respuesta del servidor
 */
export const updateRank = async (id, rankData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, rankData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return transformRankUrls(response.data);
    } catch (error) {
        handleError(error, 'Error al actualizar el rango');
        throw error;
    }
};

/**
 * Eliminar un rango
 * @param {string} id - ID del rango a eliminar
 * @returns {Promise} Respuesta del servidor
 */
export const deleteRank = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar el rango');
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

export default {
    createRank,
    getAllRanks,
    getNextRank,
    updateRank,
    deleteRank
};
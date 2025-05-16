import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/rewardcouponpreset`;

// Crear un nuevo RewardCouponPreset
export const createRewardCouponPreset = async (presetData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/create`, presetData);
        return response.data;
    } catch (error) {
        console.error('Error al crear RewardCouponPreset:', error);
        throw error;
    }
};

// Obtener un RewardCouponPreset por su ID
export const getRewardCouponPresetById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener RewardCouponPreset por ID:', error);
        throw error;
    }
};


// Obtener un RewardCouponPreset por su tipo
export const getRewardCouponPresetByType = async (type) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/type/${type}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener RewardCouponPreset por tipo (${type}):`, error?.response?.data || error);
        throw error;
    }
};


// Obtener todos los RewardCouponPresets
export const getAllRewardCouponPresets = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todos los RewardCouponPresets:', error);
        throw error;
    }
};

// Actualizar un RewardCouponPreset
export const updateRewardCouponPreset = async (id, presetData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/update/${id}`, presetData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar RewardCouponPreset:', error);
        throw error;
    }
};

// Eliminar un RewardCouponPreset
export const deleteRewardCouponPreset = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/delete/${id}`);
    } catch (error) {
        console.error('Error al eliminar RewardCouponPreset:', error);
        throw error;
    }
};

export default {
    createRewardCouponPreset,
    getRewardCouponPresetById,
    getAllRewardCouponPresets,
    updateRewardCouponPreset,
    deleteRewardCouponPreset
};

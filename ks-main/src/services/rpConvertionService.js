import axios from 'axios';

// Define la URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`; // Cambia el puerto si es necesario

// Crear una nueva conversión de RP a divisa
export const createRPPriceConversion = async (rpPrice, currency,priceSeguro ,priceBarato) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rpConvertion/create`, { rpPrice, currency, priceSeguro ,priceBarato });
        return response.data;
    } catch (error) {
        console.error('Error al crear la conversión:', error.response.data.message);
        throw error;
    }
};

// Obtener todas las conversiones
export const getAllRPPriceConversions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rpConvertion/getAll`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las conversiones:', error.response.data.message);
        throw error;
    }
};

// Obtener una conversión por ID
export const getRPPriceConversionById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/rpConvertion/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener la conversión:', error.response.data.message);
        throw error;
    }
};

// Actualizar una conversión existente
export const updateRPPriceConversion = async (id, updates) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/rpConvertion/edit/${id}`, updates);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar la conversión:', error.response.data.message);
        throw error;
    }
};

// Eliminar una conversión
export const deleteRPPriceConversion = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/rpConvertion/delete/${id}`);
    } catch (error) {
        console.error('Error al eliminar la conversión:', error.response.data.message);
        throw error;
    }
};


// Activar una conversión
export const activeRPPriceConversion = async (id) => {
    try {
        await axios.put(`${API_BASE_URL}/rpConvertion/active/${id}`);
    } catch (error) {
        console.error('Error al eliminar la conversión:', error.response.data.message);
        throw error;
    }
};

// Convertir RP a divisa para usuarios
export const convertRPtoCurrency = async (rpPriceId, currencyId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/rpConvertion/convert`, { rpPriceId, currencyId });
        return response.data;
    } catch (error) {
        console.error('Error al convertir RP a divisa:', error.response.data.message);
        throw error;
    }
};

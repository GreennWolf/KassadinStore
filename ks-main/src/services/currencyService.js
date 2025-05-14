import axios from 'axios';
// Define la URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`; // Cambia el puerto si es necesario
const API_IMAGE_BASE = `${import.meta.env.VITE_API_URL}/currencys`; // Cambia el puerto si es necesario

// Crear una nueva divisa
export const createCurrency = async (formData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/currencies/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const data = response.data;
        if (data.src) {
            data.imageUrl = `${API_IMAGE_BASE}/${data.src}`;
        }
        return data;
    } catch (error) {
        console.error('Error al crear la divisa:', error.response?.data.message);
        throw error;
    }
};

export const getCurrencyById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/currencies/getById/${id}`);
        const data = response.data;
        if (data.src) {
            data.imageUrl = `${API_IMAGE_BASE}/${data.src}`;
        }
        return data;
    } catch (error) {
        console.error('Error al obtener el estado:', error);
        throw error;
    }
};

// Obtener todas las divisas
export const getAllCurrencies = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/currencies/getAll`);
        // Mapear cada divisa para agregar la URL completa de la imagen
        const currencies = response.data.map(currency => {
            if (currency.src) {
                currency.imageUrl = `${API_IMAGE_BASE}/${currency.src}`;
            }
            return currency;
        });
        return currencies;
    } catch (error) {
        console.error('Error al obtener las divisas:', error.response?.data.message);
        throw error;
    }
};

// Actualizar una divisa existente
export const updateCurrency = async (id, formData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/currencies/update/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        const data = response.data;
        if (data.src) {
            data.imageUrl = `${API_IMAGE_BASE}/${data.src}`;
        }
        return data;
    } catch (error) {
        console.error('Error al actualizar la divisa:', error.response?.data.message);
        throw error;
    }
};

// Eliminar una divisa
export const deleteCurrency = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/currencies/delete/${id}`);
    } catch (error) {
        console.error('Error al eliminar la divisa:', error.response?.data.message);
        throw error;
    }
};

// Activar una divisa
export const activeCurrency = async (id) => {
    try {
        await axios.put(`${API_BASE_URL}/currencies/active/${id}`);
    } catch (error) {
        console.error('Error al eliminar la divisa:', error.response?.data.message);
        throw error;
    }
};
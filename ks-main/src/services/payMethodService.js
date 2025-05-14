// src/services/payMethodService.js
import axios from 'axios';

// Define la URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`; // Cambia el puerto si es necesario

// Crear un nuevo método de pago
export const createPaymentMethod = async (method, details) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/payment-methods/create`, { method, details });
        return response.data;
    } catch (error) {
        console.error('Error al crear el método de pago:', error.response?.data?.message || error.message);
        throw error;
    }
};

// Obtener todos los métodos de pago
export const getAllPaymentMethods = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/payment-methods/getAll`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los métodos de pago:', error.response?.data?.message || error.message);
        throw error;
    }
};

// Actualizar un método de pago existente
export const updatePaymentMethod = async (id, updates) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/payment-methods/edit/${id}`, updates);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el método de pago:', error.response?.data?.message || error.message);
        throw error;
    }
};

// Eliminar un método de pago
export const deletePaymentMethod = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/payment-methods/delete/${id}`);
    } catch (error) {
        console.error('Error al eliminar el método de pago:', error.response?.data?.message || error.message);
        throw error;
    }
};

//Activar
export const activePaymentMethod = async (id) => {
    try {
        await axios.put(`${API_BASE_URL}/payment-methods/active/${id}`);
    } catch (error) {
        console.error('Error al eliminar el método de pago:', error.response?.data?.message || error.message);
        throw error;
    }
};

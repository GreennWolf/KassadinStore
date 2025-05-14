import axios from 'axios';
import { getUserId } from './purcharseService';


const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/cupon`;

// Crear un nuevo cupón
export const createCupon = async (cuponData) => {
    try {
        const formattedData = {
            ...cuponData,
            currencyValues: cuponData.type === 'fixed' ? 
                (cuponData.currencyValues || []).map(cv => ({
                    currencyId: cv.currency._id || cv.currency,
                    fixedValue: cv.value
                })) : 
                undefined
        };

        const response = await axios.post(`${API_BASE_URL}/create`, formattedData);
        return response.data;
    } catch (error) {
        console.error('Error al crear cupón:', error);
        throw error;
    }
};

// Obtener todos los cupones
export const getAllCupons = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/all`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener cupones:', error);
        throw error;
    }
};

// Obtener un cupón por ID
export const getCuponById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener el cupón por ID:', error);
        throw error;
    }
};

// Actualizar un cupón
export const updateCupon = async (id, cuponData) => {
    try {
        const formattedData = {
            ...cuponData,
            currencyValues: cuponData.type === 'fixed' ? 
                (cuponData.currencyValues || []).map(cv => ({
                    currencyId: cv.currency._id || cv.currency,
                    fixedValue: cv.value
                })) : 
                undefined
        };

        const response = await axios.put(`${API_BASE_URL}/update/${id}`, formattedData);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar cupón:', error);
        throw error;
    }
};

// Eliminar un cupón
export const deleteCupon = async (id) => {
    try {
        await axios.delete(`${API_BASE_URL}/delete/${id}`);
    } catch (error) {
        console.error('Error al eliminar cupón:', error);
        throw error;
    }
};

// Active un cupón
export const activeCupon = async (id) => {
    try {
        await axios.put(`${API_BASE_URL}/active/${id}`);
    } catch (error) {
        console.error('Error al eliminar cupón:', error);
        throw error;
    }
};

// Validar un cupón
export const validateCupon = async (cuponCode, currencyId) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/validate`, { cuponCode, currencyId });
        return response.data;
    } catch (error) {
        console.error('Error al validar cupón:', error);
        throw error;
    }
};
export const validateRewardCoupon = async (couponCode) => {
    try {
        const userId = getUserId();
        const response = await axios.post(`${API_BASE_URL}/validate-reward`, { couponCode, userId });
        return response.data;
    } catch (error) {
        console.error('Error al validar cupón de recompensa:', error);
        throw error;
    }
};

export default {
    createCupon,
    getAllCupons,
    getCuponById,
    updateCupon,
    deleteCupon,
    activeCupon,
    validateCupon,
    validateRewardCoupon
};

// services/paymentMethodCurrencyService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api/payment-method-currencies';

export const setPaymentMethodCurrencies = async (paymentMethodId, currencyIds, isRestricted = true) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/set`, {
            paymentMethodId,
            currencyIds,
            isRestricted
        });
        return response.data;
    } catch (error) {
        console.error('Error al configurar las divisas del método de pago:', error);
        throw error;
    }
};

export const getAvailableCurrencies = async (paymentMethodId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/available/${paymentMethodId}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener las divisas disponibles:', error);
        throw error;
    }
};

export const getAllPaymentMethodCurrencies = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/all`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener todas las relaciones:', error);
        throw error;
    }
};

export const removeRestrictions = async (paymentMethodId) => {
    try {
        await axios.delete(`${API_BASE_URL}/restrictions/${paymentMethodId}`);
    } catch (error) {
        console.error('Error al eliminar las restricciones:', error);
        throw error;
    }
};
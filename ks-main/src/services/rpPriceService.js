import axios from 'axios';

// URL base para los precios RP
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RP_PRICES_URL = `${API_URL}/api/items/rp-price`;

/**
 * Obtener todos los precios de RP disponibles
 * @returns {Promise<Array>} Lista de precios de RP
 */
export const getRPPrices = async () => {
  try {
    const response = await axios.get(`${RP_PRICES_URL}/getAll`);
    return response.data;
  } catch (error) {
    console.error('Error fetching RP prices:', error);
    throw error;
  }
};

/**
 * Obtener un precio de RP específico por ID
 * @param {string} id - ID del precio RP a obtener
 * @returns {Promise<Object>} Precio RP
 */
export const getRPPriceById = async (id) => {
  try {
    const response = await axios.get(`${RP_PRICES_URL}/getAll`);
    // Filtramos los resultados para obtener el precio por ID
    const rpPrice = response.data.find(price => price._id === id);
    if (!rpPrice) {
      throw new Error('Precio RP no encontrado');
    }
    return rpPrice;
  } catch (error) {
    console.error(`Error fetching RP price with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Obtener los precios de RP activos
 * @returns {Promise<Array>} Lista de precios de RP activos
 */
export const getActiveRPPrices = async () => {
  try {
    const response = await axios.get(`${RP_PRICES_URL}/getAll`);
    // Filtrar solo los precios activos
    return response.data.filter(price => price.active);
  } catch (error) {
    console.error('Error fetching active RP prices:', error);
    throw error;
  }
};
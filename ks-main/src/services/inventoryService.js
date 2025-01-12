import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/api/chromas`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images`;

import { getUpdatedUser } from './userService';

// Función para obtener el userId del localStorage
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id : null;
};

// Función para transformar las URLs de las imágenes según el tipo de item
const transformImageUrls = (item) => {
    if (!item || !item.itemId) return item;

    const transformedItem = { ...item };
    
    if (transformedItem.itemType === 'Item') {
        const itemDetails = transformedItem.itemId;
        const baseUrl = itemDetails.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
        
        transformedItem.itemId = {
            ...itemDetails,
            srcLocal: itemDetails.srcLocal ? `${baseUrl}/${itemDetails.srcLocal.replace(/\\/g, '/')}` : null,
            srcWeb: itemDetails.srcWeb || null
        };
    } else if (transformedItem.itemType === 'Skin') {
        const skinDetails = transformedItem.itemId;
        transformedItem.itemId = {
            ...skinDetails,
            srcLocal: skinDetails.srcLocal ? `${API_BASE_IMAGE}/${skinDetails.srcLocal.replace(/\\/g, '/')}` : null,
            src: skinDetails.src || null
        };
    }

    return transformedItem;
};

// Función para transformar arrays de items
const transformItemsArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(transformImageUrls);
};

/**
 * Obtener los items activos del inventario del usuario actual
 * @returns {Promise} Items activos del inventario con URLs transformadas
 */
export const getActiveItems = async () => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const response = await axios.get(`${API_BASE_URL}/inventory/active/${userId}`);
        return {
            ...response.data,
            items: transformItemsArray(response.data.items)
        };
    } catch (error) {
        handleError(error, 'Error al obtener los items activos del inventario');
        throw error;
    }
};

/**
 * Obtener los items usados del inventario del usuario actual
 * @param {Object} params - Parámetros de paginación y filtros
 * @returns {Promise} Items usados del inventario con URLs transformadas
 */
export const getUsedItems = async (params = {}) => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const response = await axios.get(`${API_BASE_URL}/inventory/used/${userId}`, { params });
        return {
            ...response.data,
            items: transformItemsArray(response.data.items)
        };
    } catch (error) {
        handleError(error, 'Error al obtener los items usados del inventario');
        throw error;
    }
};

/**
 * Obtener el historial completo del inventario del usuario actual
 * @param {Object} params - Parámetros de paginación y filtros
 * @returns {Promise} Historial completo del inventario con URLs transformadas
 */
export const getInventoryHistory = async (params = {}) => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const response = await axios.get(`${API_BASE_URL}/inventory/history/${userId}`, { params });
        return {
            ...response.data,
            items: transformItemsArray(response.data.items)
        };
    } catch (error) {
        handleError(error, 'Error al obtener el historial del inventario');
        throw error;
    }
};

/**
 * Verificar si se puede comprar un item
 * @param {Object} purchaseData - Datos de la compra (itemType, itemId, quantity)
 * @returns {Promise} Información sobre la posibilidad de compra
 */
export const canPurchaseItem = async (purchaseData) => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');
        
        const response = await axios.post(`${API_BASE_URL}/inventory/can-purchase`, {
            ...purchaseData,
            userId
        });
        
        return response.data;
    } catch (error) {
        handleError(error, 'Error al verificar la compra');
        throw error;
    }
};

/**
 * Comprar y agregar un item al inventario
 * @param {Object} purchaseData - Datos de la compra (itemType, itemId, quantity)
 * @returns {Promise} Resultado de la compra con URLs transformadas
 */
export const purchaseItem = async (purchaseData) => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const response = await axios.post(`${API_BASE_URL}/inventory/purchase`, {
            ...purchaseData,
            userId
        });
        getUpdatedUser(userId);
        return {
            ...response.data,
            inventory: {
                ...response.data.inventory,
                activeItems: transformItemsArray(response.data.inventory.activeItems)
            }
        };
    } catch (error) {
        handleError(error, 'Error al realizar la compra');
        throw error;
    }
};

/**
 * Usar un item del inventario
 * @param {Object} useData - Datos del uso (itemId, quantity)
 * @returns {Promise} Resultado del uso del item con URLs transformadas
 */
export const useItem = async (useData) => {
    try {
        const userId = getUserId();
        if (!userId) throw new Error('Usuario no autenticado');

        const response = await axios.post(`${API_BASE_URL}/inventory/use`, {
            ...useData,
            userId
        });

        return {
            ...response.data,
            inventory: {
                ...response.data.inventory,
                activeItems: transformItemsArray(response.data.inventory.activeItems),
                usedItems: transformItemsArray(response.data.inventory.usedItems)
            }
        };
    } catch (error) {
        handleError(error, 'Error al usar el item');
        throw error;
    }
};

/**
 * Manejador de errores centralizado
 */
const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.message === 'Usuario no autenticado') {
        throw new Error('Debes iniciar sesión para realizar esta acción');
    }
    if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
    } else if (error.response) {
        throw new Error(defaultMessage);
    } else if (error.request) {
        throw new Error('No se recibió respuesta del servidor');
    } else {
        throw new Error(error.message || defaultMessage);
    }
};

export default {
    getActiveItems,
    getUsedItems,
    getInventoryHistory,
    canPurchaseItem,
    purchaseItem,
    useItem
};
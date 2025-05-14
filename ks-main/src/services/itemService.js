import axios from 'axios';
import {getUpdatedUser} from './userService';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/chromas`;

// Función auxiliar para transformar las URLs de las imágenes
const transformImageUrls = (item) => {
    if (!item) return null;
    
    const baseUrl = item.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    
    return {
        ...item,
        srcLocal: item.srcLocal ? `${baseUrl}/${item.srcLocal.replace(/\\/g, '/')}` : null
    };
};

const transformItemsArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(transformImageUrls);
};

const validateItemType = (type) => {
    const validTypes = ['loot', 'icon', 'chromas', 'presale', 'tft', 'bundle'];
    return validTypes.includes(type);
};

export const createItem = async (formData) => {
    try {
        // Asegurarse de que reward se incluya en el FormData
        if (!formData.has('reward')) {
            formData.append('reward', 'false');
        }

        const response = await axios.post(`${API_BASE_URL}/items/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al crear el item:', error);
        throw error;
    }
};

export const editItem = async (id, itemData) => {
    try {
        if (itemData.get('type') && !validateItemType(itemData.get('type'))) {
            throw new Error('Tipo de item no válido');
        }

        // Asegurarse de que reward se incluya en el FormData
        if (!itemData.has('reward')) {
            itemData.append('reward', 'false');
        }

        const response = await axios.put(`${API_BASE_URL}/items/update/${id}`, itemData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al editar el item:', error);
        throw error;
    }
};

export const getAllItems = async (params) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            type, 
            showAll,
            reward // Nuevo parámetro para filtrar por reward
        } = params;

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search || '',
            ...(type && { type }),
            ...(showAll && { showAll: showAll.toString() }),
            ...(reward !== undefined && { reward: reward.toString() })
        });

        const response = await axios.get(`${API_BASE_URL}/items/getAll?${queryParams}`);
        
        if (response.data && response.data.data) {
            return {
                ...response.data,
                data: transformItemsArray(response.data.data)
            };
        }
        
        return {
            data: [],
            total: 0,
            currentPage: 1,
            totalPages: 0,
            hasMore: false
        };
    } catch (error) {
        console.error('Error al obtener los items:', error);
        throw error;
    }
};

export const getItemsByType = async (type, params = {}) => {
    try {
        if (!validateItemType(type)) {
            throw new Error('Tipo de item no válido');
        }

        const queryParams = new URLSearchParams({
            ...(params.reward !== undefined && { reward: params.reward.toString() })
        });

        const response = await axios.get(`${API_BASE_URL}/items/type/${type}?${queryParams}`);
        return transformItemsArray(response.data);
    } catch (error) {
        console.error('Error al obtener items por tipo:', error);
        throw error;
    }
};

export const getItemById = async (id) => {
    try {
        if (!id) {
            throw new Error('ID de item no proporcionado');
        }

        const response = await axios.get(`${API_BASE_URL}/items/get/${id}`);
        return transformImageUrls(response.data);
    } catch (error) {
        console.error(`Error al obtener el item con ID ${id}:`, error);
        throw error;
    }
};

export const deleteItem = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/items/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar el item:', error);
        throw error;
    }
};

export const activeItem = async (id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/items/active/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al activar el item:', error);
        throw error;
    }
};

// Añadir estas funciones en itemService.js

export const getAllDestacadosItems = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/items/destacados`);
        return transformItemsArray(response.data);
    } catch (error) {
        console.error('Error al obtener los items destacados:', error);
        throw error;
    }
};

export const toggleDestacadoItem = async (id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/items/destacado/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al cambiar el estado destacado del item:', error);
        throw error;
    }
};

// Y asegúrate de incluirlas en el export default al final
export default {
    createItem,
    editItem,
    getItemById,
    getAllItems,
    getItemsByType,
    deleteItem,
    activeItem,
    getAllDestacadosItems,
    toggleDestacadoItem,
    transformImageUrls,
    transformItemsArray
};
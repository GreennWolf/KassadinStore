import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_ITEMS = 'http://localhost:3000/items';
const API_BASE_CHROMAS = 'http://localhost:3000/chromas';

// Función auxiliar para transformar las URLs de las imágenes
const transformImageUrls = (item) => {
    if (!item) return null;
    
    // Seleccionar la URL base según el tipo de item
    const baseUrl = item.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    
    return {
        ...item,
        srcLocal: item.srcLocal ? `${baseUrl}/${item.srcLocal.replace(/\\/g, '/')}` : null
    };
};

// Función auxiliar para transformar arrays de items
const transformItemsArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map(transformImageUrls);
};

// Función para validar el tipo de item
const validateItemType = (type) => {
    const validTypes = ['loot', 'icon', 'chromas', 'presale', 'tft','bundle'];
    return validTypes.includes(type);
};

export const createItem = async (formData) => {
    try {
        // Log para verificar que los datos lleguen correctamente
        // console.log('Enviando FormData al servidor:');
        for (let pair of formData.entries()) {
            // console.log(pair[0] + ': ' + (pair[1] instanceof File ? 'File: ' + pair[1].name : pair[1]));
        }

        const response = await axios.post(`${API_BASE_URL}/items/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al crear el item:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw error;
    }
};

export const editItem = async (id, itemData) => {
    try {
        // Validación del tipo antes de continuar
        if (itemData.get('type') && !validateItemType(itemData.get('type'))) {
            throw new Error('Tipo de item no válido');
        }

        console.log('Datos recibidos en editItem:', {
            name: itemData.get('name'),
            type: itemData.get('type'),
            priceRP: itemData.get('priceRP')
        });

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
        const { page = 1, limit = 20, search = '', type  , showAll} = params;

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search || '',
            ...(type && { type }) ,// Solo incluimos type si existe
            showAll
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

export const getItemsByType = async (type) => {
    try {
        // Validar tipo de item
        if (!validateItemType(type)) {
            throw new Error('Tipo de item no válido');
        }

        const response = await axios.get(`${API_BASE_URL}/items/type/${type}`);
        return transformItemsArray(response.data);
    } catch (error) {
        console.error('Error al obtener items por tipo:', error);
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

// Nueva función para obtener un item por ID
export const getItemById = async (id) => {
    try {
        if (!id) {
            throw new Error('ID de item no proporcionado');
        }

        const response = await axios.get(`${API_BASE_URL}/items/get/${id}`);
        
        // Transformar las URLs de las imágenes antes de devolver el item
        return transformImageUrls(response.data);
    } catch (error) {
        console.error(`Error al obtener el item con ID ${id}:`, error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw error;
    }
};

// Exportar todas las funciones
export default {
    createItem,
    editItem,
    getItemById,
    getAllItems,
    getItemsByType,
    deleteItem,
    transformImageUrls,
    transformItemsArray
};
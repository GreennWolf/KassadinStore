import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const API_BASE_UNRANKEDS = `${import.meta.env.VITE_API_URL}/unrankeds`;

// Función auxiliar para transformar las URLs de las imágenes
const transformImageUrls = (unranked) => {
    if (!unranked) return null;
    
    // console.log({        ...unranked,
    //     srcLocal: unranked.srcLocal ? `${API_BASE_UNRANKEDS}/${unranked.srcLocal.replace(/\\/g, '/')}` : null})

    return {
        ...unranked,
        srcLocal: unranked.srcLocal ? `${API_BASE_UNRANKEDS}/${unranked.srcLocal.replace(/\\/g, '/')}` : null
    };
};

const transformUnrankedsArray = (unrankeds) => {
    if (!Array.isArray(unrankeds)) return [];
    return unrankeds.map(transformImageUrls);
};

const validateRegion = (region) => {
    const validRegions = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];
    return validRegions.includes(region);
};

export const createUnranked = async (formData) => {
    try {
        // Validar región si está presente en el formData
        const region = formData.get('region');
        if (region && !validateRegion(region)) {
            throw new Error('Región no válida');
        }

        const response = await axios.post(`${API_BASE_URL}/unrankeds`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al crear la cuenta unranked:', error);
        throw error;
    }
};

export const updateUnranked = async (id, unrankedData) => {
    try {
        const region = unrankedData.get('region');
        if (region && !validateRegion(region)) {
            throw new Error('Región no válida');
        }

        const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}`, unrankedData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al editar la cuenta unranked:', error);
        throw error;
    }
};

export const getAllUnrankeds = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            region,
            minLevel,
            maxLevel,
            minRP,
            maxRP,
            showAll = false 
        } = params;

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search || '',
            ...(region && { region }),
            ...(minLevel && { minLevel: minLevel.toString() }),
            ...(maxLevel && { maxLevel: maxLevel.toString() }),
            ...(minRP && { minRP: minRP.toString() }),
            ...(maxRP && { maxRP: maxRP.toString() }),
            ...(showAll && { showAll: showAll.toString() })
        });

        const response = await axios.get(`${API_BASE_URL}/unrankeds?${queryParams}`);
        
        if (response.data && response.data.data) {
            return {
                ...response.data,
                data: transformUnrankedsArray(response.data.data)
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
        console.error('Error al obtener las cuentas unranked:', error);
        throw error;
    }
};

export const getUnrankedById = async (id) => {
    try {
        if (!id) {
            throw new Error('ID de cuenta no proporcionado');
        }

        const response = await axios.get(`${API_BASE_URL}/unrankeds/${id}`);
        return transformImageUrls(response.data);
    } catch (error) {
        console.error(`Error al obtener la cuenta unranked con ID ${id}:`, error);
        throw error;
    }
};

export const getUnrankedsByRegion = async (region, params = {}) => {
    try {
        if (!validateRegion(region)) {
            throw new Error('Región no válida');
        }

        const queryParams = new URLSearchParams({
            region,
            ...params
        });

        const response = await axios.get(`${API_BASE_URL}/unrankeds?${queryParams}`);
        return transformUnrankedsArray(response.data.data);
    } catch (error) {
        console.error('Error al obtener cuentas por región:', error);
        throw error;
    }
};

export const deactivateUnranked = async (id) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/unrankeds/${id}/deactivate`);
        return response.data;
    } catch (error) {
        console.error('Error al desactivar la cuenta unranked:', error);
        throw error;
    }
};

export const activateUnranked = async (id) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/unrankeds/${id}/activate`);
        return response.data;
    } catch (error) {
        console.error('Error al activar la cuenta unranked:', error);
        throw error;
    }
};

export default {
    createUnranked,
    updateUnranked,
    getAllUnrankeds,
    getUnrankedById,
    getUnrankedsByRegion,
    deactivateUnranked,
    activateUnranked,
    transformImageUrls,
    transformUnrankedsArray
};
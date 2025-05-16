import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images`;
const API_BASE_UNRANKEDS = `${import.meta.env.VITE_API_URL}/unrankeds`;

// Función auxiliar para transformar las URLs de las imágenes
const transformImageUrls = (unranked) => {
    if (!unranked) return null;
    
    // Transformar URLs de imagen para la cuenta unranked
    const transformedUnranked = {
        ...unranked,
        srcLocal: unranked.srcLocal ? `${API_BASE_UNRANKEDS}/${unranked.srcLocal.replace(/\\/g, '/')}` : null
    };
    
    // Si hay skins y son un array, también transformamos sus URLs
    if (transformedUnranked.skins && Array.isArray(transformedUnranked.skins)) {
        transformedUnranked.skins = transformedUnranked.skins.map(skin => {
            if (!skin) return null;
            return {
                ...skin,
                srcLocal: skin.srcLocal ? `${API_BASE_IMAGE}/${skin.srcLocal.replace(/\\/g, '/')}` : null
            };
        }).filter(Boolean); // Eliminar elementos nulos
    }
    
    return transformedUnranked;
};

const transformUnrankedsArray = (unrankeds) => {
    if (!Array.isArray(unrankeds)) return [];
    return unrankeds.map(transformImageUrls).filter(Boolean); // Eliminar elementos nulos
};

const validateRegion = (region) => {
    const validRegions = ['LAS', 'LAN', 'NA', 'EUW', 'EUNE', 'OCE', 'BR', 'KR', 'JP', 'TR', 'RU'];
    return validRegions.includes(region);
};

// Función auxiliar para limpiar y validar los IDs de skins
const cleanSkinIds = (skinIds) => {
    if (!Array.isArray(skinIds)) return [];
    
    return skinIds
        .filter(id => typeof id === 'string' && id.match(/^[0-9a-fA-F]{24}$/))
        .map(id => id.trim());
};

export const createUnranked = async (formData) => {
    try {
        // console.log('Preparando envío para crear cuenta unranked');
        
        // Verificar que formData sea un FormData
        if (!(formData instanceof FormData)) {
            console.error('Se esperaba FormData pero se recibió:', typeof formData);
            throw new Error('Se requiere FormData para crear una cuenta unranked');
        }
        
        // Verificar campos requeridos
        const requiredFields = ['titulo', 'priceRP', 'nivel', 'rpAmount', 'region', 'escenciaNaranja'];
        const missingFields = [];
        
        // Comprobar cada campo requerido
        for (const field of requiredFields) {
            const value = formData.get(field);
            if (!value && value !== 0 && value !== false) {
                missingFields.push(field);
            }
        }
        
        if (missingFields.length > 0) {
            console.error('Faltan campos requeridos:', missingFields);
            throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
        }
        
        // Verificar formato de skins
        const skinEntries = formData.getAll('skins[]');
        
        // Mostrar todos los campos para depuración
        // console.log('Campos en FormData:');
        for (let [key, value] of formData.entries()) {
            // console.log(`${key}: ${value instanceof File ? 'File: ' + value.name : value}`);
        }
        
        // Enviar al servidor
        // console.log('Enviando FormData al servidor');
        const response = await axios.post(`${API_BASE_URL}/unrankeds`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al crear la cuenta unranked:', error);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.status, error.response.data);
        }
        throw error;
    }
};

export const updateUnranked = async (id, unrankedData) => {
    try {
        // console.log('Preparando envío para actualizar cuenta unranked');
        
        // Si es un FormData
        if (unrankedData instanceof FormData) {
            // console.log('Actualizando con FormData');
            
            // Mostrar campos para depuración
            // console.log('Campos en FormData:');
            for (let [key, value] of unrankedData.entries()) {
                // console.log(`${key}: ${value instanceof File ? 'File: ' + value.name : value}`);
            }
            
            // Enviar directamente - ahora manejamos correctamente skins[] en el frontend
            const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}`, unrankedData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            return transformImageUrls(response.data);
        } else {
            // Si es un objeto JSON
            // console.log('Actualizando con JSON:', unrankedData);
            
            // Asegurar que skins es un array en el formato correcto
            if (unrankedData.skins && Array.isArray(unrankedData.skins)) {
                unrankedData.skins = cleanSkinIds(unrankedData.skins);
            }
            
            const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}`, unrankedData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return transformImageUrls(response.data);
        }
    } catch (error) {
        console.error('Error al editar la cuenta unranked:', error);
        if (error.response) {
            console.error('Respuesta del servidor:', error.response.status, error.response.data);
        }
        throw error;
    }
};

export const getAllUnrankeds = async (params = {}) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            skinSearch = '', // Nueva opción para búsqueda de skins
            region,
            minLevel,
            maxLevel,
            minRP,
            maxRP,
            showAll = false,
            includeSearch = false // Para búsqueda inclusiva
        } = params;

        // console.log("Parámetros de búsqueda en unrankedService:", params);

        // Preparar la búsqueda inclusiva y manejar espacios correctamente
        let useInclusiveSearch = includeSearch || false;
        let processedSearch = search;
        let processedSkinSearch = skinSearch;
        
        // Siempre activar búsqueda inclusiva si hay espacios en cualquier término
        if ((search && search.includes(' ')) || (skinSearch && skinSearch.includes(' '))) {
            useInclusiveSearch = true;
            // console.log("Activando búsqueda inclusiva automáticamente debido a espacios");
        }
        
        // Depuración de los términos de búsqueda
        if (search) // console.log(`Búsqueda general: "${search}"`);
        if (skinSearch) // console.log(`Búsqueda de skins: "${skinSearch}"`);
        // console.log(`Búsqueda inclusiva: ${useInclusiveSearch ? 'Activada' : 'Desactivada'}`);

        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search: search || '',
            ...(skinSearch && { skinSearch }),
            ...(region && { region }),
            ...(minLevel && { minLevel: minLevel.toString() }),
            ...(maxLevel && { maxLevel: maxLevel.toString() }),
            ...(minRP && { minRP: minRP.toString() }),
            ...(maxRP && { maxRP: maxRP.toString() }),
            ...(showAll && { showAll: showAll.toString() }),
            ...(useInclusiveSearch && { includeSearch: 'true' })
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
        return transformImageUrls(response.data.unranked);
    } catch (error) {
        console.error('Error al desactivar la cuenta unranked:', error);
        throw error;
    }
};

export const activateUnranked = async (id) => {
    try {
        const response = await axios.patch(`${API_BASE_URL}/unrankeds/${id}/activate`);
        return transformImageUrls(response.data.unranked);
    } catch (error) {
        console.error('Error al activar la cuenta unranked:', error);
        throw error;
    }
};

// Funciones para gestionar skins - simplificadas y mejoradas

export const addSkinsToUnranked = async (id, skinIds) => {
    try {
        if (!id) {
            throw new Error('ID de cuenta no proporcionado');
        }

        // Limpiar y validar IDs
        const validSkinIds = cleanSkinIds(skinIds);
        
        if (validSkinIds.length === 0) {
            throw new Error('No se proporcionaron IDs de skins válidos');
        }

        const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}/add-skins`, { skinIds: validSkinIds });
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al añadir skins a la cuenta unranked:', error);
        throw error;
    }
};

export const removeSkinsFromUnranked = async (id, skinIds) => {
    try {
        if (!id) {
            throw new Error('ID de cuenta no proporcionado');
        }

        // Limpiar y validar IDs
        const validSkinIds = cleanSkinIds(skinIds);
        
        if (validSkinIds.length === 0) {
            throw new Error('No se proporcionaron IDs de skins válidos');
        }

        const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}/remove-skins`, { skinIds: validSkinIds });
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al eliminar skins de la cuenta unranked:', error);
        throw error;
    }
};

export const setSkinsForUnranked = async (id, skinIds) => {
    try {
        if (!id) {
            throw new Error('ID de cuenta no proporcionado');
        }

        // Limpiar y validar IDs
        const validSkinIds = cleanSkinIds(skinIds);

        const response = await axios.put(`${API_BASE_URL}/unrankeds/${id}/set-skins`, { skinIds: validSkinIds });
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al establecer skins para la cuenta unranked:', error);
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
    addSkinsToUnranked,
    removeSkinsFromUnranked,
    setSkinsForUnranked,
    transformImageUrls,
    transformUnrankedsArray
};
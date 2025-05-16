import axios from 'axios';
import { getUpdatedUser } from './userService';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/perfil-images`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}`;

const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id : null;
};

const transformImageUrls = (perfilImages) => {
    if (!perfilImages) return null;
    return {
        ...perfilImages,
        src: perfilImages.src ? `${API_BASE_IMAGE}${perfilImages.src.replace(/\\/g, '/')}` : null
    };
};

// Función auxiliar para transformar arrays de skins
const transformPerfilImagesArray = (PerfilImages) => {
    if (!Array.isArray(PerfilImages)) return [];
    return PerfilImages.map(transformImageUrls);
};


/**
 * Crear una nueva imagen de perfil
 * @param {FormData} imageData - Datos de la imagen (debe incluir el archivo y el nombre)
 * @returns {Promise} Respuesta del servidor
 */
export const createPerfilImage = async (imageData) => {
    try {
        for (const [key, value] of imageData.entries()) {
            // // console.log(`${key}:`, value);
        }
        const response = await axios.post(`${API_BASE_URL}/`, imageData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        handleError(error, 'Error al crear la imagen de perfil');
        throw error;
    }
};

/**
 * Crear o actualizar la imagen de perfil por defecto
 * @param {FormData} imageData - Datos de la imagen por defecto
 * @returns {Promise} Respuesta del servidor
 */
export const createDefaultPerfilImage = async (imageData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/default`, imageData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        handleError(error, 'Error al crear la imagen de perfil por defecto');
        throw error;
    }
};

/**
 * Obtener todas las imágenes de perfil
 * @returns {Promise} Lista de imágenes de perfil
 */
export const getAllPerfilImages = async () => {
    try {
        const response = await axios.get(API_BASE_URL);
        if (response.data && Array.isArray(response.data)) {
            return {
                ...response.data,
                data: transformPerfilImagesArray(response.data)
            }
        }


    } catch (error) {
        handleError(error, 'Error al obtener las imágenes de perfil');
        throw error;
    }
};

/**
 * Actualizar una imagen de perfil
 * @param {string} id - ID de la imagen de perfil
 * @param {FormData} imageData - Datos actualizados de la imagen
 * @returns {Promise} Respuesta del servidor
 */
export const updatePerfilImage = async (id, imageData) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}`, imageData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        handleError(error, 'Error al actualizar la imagen de perfil');
        throw error;
    }
};

/**
 * Eliminar una imagen de perfil
 * @param {string} id - ID de la imagen de perfil a eliminar
 * @returns {Promise} Respuesta del servidor
 */
export const deletePerfilImage = async (id) => {
    try {
        
        const response = await axios.delete(`${API_BASE_URL}/${id}`);
        const userId = getUserId();
        const us = await getUpdatedUser(userId,true)
        return response.data;
    } catch (error) {
        handleError(error, 'Error al eliminar la imagen de perfil');
        throw error;
    }
};

/**
 * Función auxiliar para manejar errores
 * @param {Error} error - Error capturado
 * @param {string} defaultMessage - Mensaje por defecto
 */
const handleError = (error, defaultMessage) => {
    console.error(defaultMessage, error);
    if (error.response) {
        // El servidor respondió con un estado fuera del rango 2xx
        throw new Error(error.response.data.message || defaultMessage);
    } else if (error.request) {
        // La petición fue hecha pero no se recibió respuesta
        throw new Error('No se recibió respuesta del servidor');
    } else {
        // Error al configurar la petición
        throw new Error(error.message || defaultMessage);
    }
};

// Ejemplo de uso para crear una imagen de perfil
export const createPerfilImageExample = () => {
    const formData = new FormData();
    formData.append('name', 'nombreImagen');
    formData.append('image', /* archivo de imagen */);
    return createPerfilImage(formData);
};

export default {
    createPerfilImage,
    createDefaultPerfilImage,
    getAllPerfilImages,
    updatePerfilImage,
    deletePerfilImage
};
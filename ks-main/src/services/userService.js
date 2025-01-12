import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`; // Asegúrate de cambiar el puerto si es necesario
const API_VERIFY_URL = `${import.meta.env.VITE_API_URL}/verify`; // Asegúrate de cambiar el puerto si es necesario

const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}`;



const transformImageUrls = (users) => {
    if (!users) return null;
    // console.log(users)
    return {
        ...users,
        src: users?.perfilImage.src ? `${API_BASE_IMAGE}${users.perfilImage.src.replace(/\\/g, '/')}` : null
    };
};

const transformImageUrlSingle = (user) => {
    if (!user) return null;
    // console.log(user)
    return {
        ...user,
        src: user.perfilImage.src ? `${API_BASE_IMAGE}${user.perfilImage.src.replace(/\\/g, '/')}` : null
    };
};

// Función auxiliar para transformar arrays de skins
const transformUsersArray = (users) => {
    if (!Array.isArray(users)) return [];
    return users.map(transformImageUrls);
};

// Función para registrar un nuevo usuario
export const registerUser = async (userData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, userData);
        return {
            ...response.data,
            data: transformImageUrlSingle(response.data.user)
        }
    } catch (error) {
        console.error('Error al registrar el usuario:', error);
        throw error;
    }
};

// Función para iniciar sesión
export const loginUser = async (credentials) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, credentials);
        if (!response.data.user.verified) {
            throw new Error('Por favor verifica tu correo electrónico antes de iniciar sesión');
        }
        return {
            ...response.data,
            data: transformImageUrlSingle(response.data.user)
        };
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        throw error;
    }
};

export const getUpdatedUser = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/getUser/${id}`);
        const updatedUser = transformImageUrlSingle(response.data);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    } catch (error) {
        console.error('Error al obtener usuario actualizado:', error);
        throw error;
    }
};

// Función para actualizar el perfil de usuario
export const updateUser = async (id, updates) => {
    try {
        // console.log(updates)
        const response = await axios.put(`${API_BASE_URL}/users/edit/${id}`, updates);
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el perfil:', error);
        throw error;
    }
};

// Función para obtener todos los usuarios
export const getUsers = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/getUsers`);
        if (response.data && Array.isArray(response.data)) {
            return {
                ...response.data,
                data: transformUsersArray(response.data)
            }
        }
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/users/delete/${id}`);
        // console.log('Usuario eliminado:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar el usuario:', error);
        throw error;
    }
};

export const verifyEmail = async (token) => {
    try {
        const response = await axios.get(`${API_VERIFY_URL}/${token}`);
        return response.data;
    } catch (error) {
        console.error('Error al verificar el email:', error);
        throw error;
    }
}
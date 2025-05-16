import axios from 'axios';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`; // Asegúrate de cambiar el puerto si es necesario
const API_VERIFY_URL = `${import.meta.env.VITE_API_URL}/verify`; // Asegúrate de cambiar el puerto si es necesario

const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}`;



const transformImageUrls = (users) => {
    if (!users) return null;
    // // console.log(users)
    return {
        ...users,
        src: users?.perfilImage.src ? `${API_BASE_IMAGE}${users.perfilImage.src.replace(/\\/g, '/')}` : null
    };
};

const transformImageUrlSingle = (user) => {
    if (!user) return null;
    // // console.log(user)
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

export const getUpdatedUser = async (id , me=false) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/getUser/${id}`);
        const updatedUser = transformImageUrlSingle(response.data);
        // No guardar automáticamente en localStorage, ya que esto afecta la sesión
        if(me){
            localStorage.setItem('user', JSON.stringify(updatedUser)); 
        }
        return updatedUser;
    } catch (error) {
        console.error('Error al obtener usuario actualizado:', error);
        throw error;
    }
};

// Función para actualizar el perfil de usuario
export const updateUser = async (id, updates) => {
    try {
        // // console.log(updates)
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
        // // console.log('Usuario eliminado:', response.data);
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

export const changePassword = async (id, passwordData) => {
    try {
        const response = await axios.put(
            `${API_BASE_URL}/users/change-password/${id}`, 
            {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            }
        );
        return response.data;
    } catch (error) {
        if (error.response) {
            // El servidor respondió con un estado fuera del rango 2xx
            throw new Error(error.response.data.message || 'Error al cambiar la contraseña');
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            throw new Error('No se pudo conectar con el servidor');
        } else {
            // Algo sucedió en la configuración de la petición
            throw new Error('Error en la petición');
        }
    }
};

// Función para solicitar el reseteo de contraseña
export const forgotPassword = async (email) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/forgot-password`, { email });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error al solicitar el reseteo de contraseña');
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor');
        } else {
            throw new Error('Error en la petición');
        }
    }
};

// Función para verificar el token de reseteo
export const verifyResetToken = async (token) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/users/verify-reset-token/${token}`);
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Token inválido o expirado');
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor');
        } else {
            throw new Error('Error en la petición');
        }
    }
};

// Función para establecer la nueva contraseña
export const resetPassword = async (token, newPassword) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/users/reset-password/${token}`, {
            newPassword
        });
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data.message || 'Error al restablecer la contraseña');
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor');
        } else {
            throw new Error('Error en la petición');
        }
    }
};

// Función para actualizar el oro del usuario
export const updateUserGold = async (id, amount, operation) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/update-gold/${id}`, {
            amount,
            operation
        });
        
        // Transformar y devolver el usuario actualizado
        return {
            ...response.data,
            data: response.data.user ? transformImageUrlSingle(response.data.user) : null
        };
    } catch (error) {
        console.error('Error al actualizar el oro del usuario:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'Error al actualizar el oro');
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor');
        } else {
            throw new Error('Error en la petición');
        }
    }
};

export const updateMultipleUsersGold = async (users) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/users/update-multiple-gold`, {
            users
        });
        
        // Transformar los usuarios actualizados
        if (response.data && response.data.users && Array.isArray(response.data.users)) {
            const transformedUsers = response.data.users.map(user => transformImageUrlSingle(user));
            return {
                ...response.data,
                users: transformedUsers
            };
        }
        
        return response.data;
    } catch (error) {
        console.error('Error al actualizar el oro de múltiples usuarios:', error);
        if (error.response) {
            throw new Error(error.response.data.message || 'Error al actualizar el oro de múltiples usuarios');
        } else if (error.request) {
            throw new Error('No se pudo conectar con el servidor');
        } else {
            throw new Error('Error en la petición');
        }
    }
};
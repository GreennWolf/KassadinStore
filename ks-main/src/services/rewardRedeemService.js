import axios from 'axios';
import { getUpdatedUser } from './userService';

// Configuración base de Axios
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Obtener ID del usuario autenticado
export const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id : null;
};

// Función para manejar errores
const handleRequestError = (error) => {
    console.error('Error en la solicitud:', error);
    throw error;
};

// Transformar datos del redeem
const transformRedeemData = (redeem) => {
    const transformed = { ...redeem };

    if (transformed.timerEndTime) {
        transformed.timeRemaining = new Date(transformed.timerEndTime).getTime() - Date.now();
    }

    if (transformed.items) {
        transformed.items = transformed.items.map(item => ({
            ...item,
            isSkin: item.itemType === 'Skin'
        }));
    }

    return transformed;
};

// Crear un nuevo redeem
export const createRedeem = async (data) => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    const { items, riotName, discordName, region } = data;

    try {
        const response = await api.post('/redeems/create', {
            userId,
            items: JSON.stringify(items),
            riotName,
            discordName,
            region
        });
        await getUpdatedUser(userId,true);
        return transformRedeemData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener todos los redeems
export const getAllRedeems = async () => {
    try {
        const response = await api.get('/redeems/getAll');
        return response.data.map(transformRedeemData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener redeems de un usuario específico
export const getUserRedeems = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/redeems/user/${userId}`);
        return response.data.map(transformRedeemData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Actualizar un redeem existente
export const updateRedeem = async (id, updates) => {
    try {
        if (updates.items) {
            updates.items = updates.items.map(item => ({
                ...item,
                isSkin: item.itemType === 'Skin'
            }));
        }

        const response = await api.put(`/redeems/edit/${id}`, updates);
        return transformRedeemData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Eliminar un redeem
export const deleteRedeem = async (id) => {
    try {
        await api.delete(`/redeems/delete/${id}`);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener redeems no leídos
export const getUnreadRedeems = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/redeems/unread/${userId}`);
        return response.data.map(transformRedeemData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Marcar estado como visto
export const markStatusAsViewed = async (redeemId) => {
    try {
        const response = await api.put(`/redeems/markViewed/${redeemId}`);
        return transformRedeemData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener cantidad de estados no leídos
export const getUnreadCount = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/redeems/unreadCount/${userId}`);
        return response.data.count;
    } catch (error) {
        handleRequestError(error);
    }
};

// Confirmar estado del redeem
export const confirmRedeemStatus = async (redeemId) => {
    try {
        const response = await api.post(`/redeems/confirm/${redeemId}`);
        if (!response.data.redeem) {
            return transformRedeemData(response.data);
        }
        return transformRedeemData(response.data.redeem);
    } catch (error) {
        handleRequestError(error);
    }
};

// Función auxiliar para chequear el temporizador de un redeem
export const checkRedeemTimer = (redeem) => {
    if (!redeem.timerEndTime) return null;
    
    const now = Date.now();
    const endTime = new Date(redeem.timerEndTime).getTime();
    
    if (now >= endTime) {
        return {
            expired: true,
            remaining: 0
        };
    }

    return {
        expired: false,
        remaining: endTime - now
    };
};

export default {
    createRedeem,
    getAllRedeems,
    getUserRedeems,
    updateRedeem,
    deleteRedeem,
    getUnreadRedeems,
    markStatusAsViewed,
    getUnreadCount,
    confirmRedeemStatus,
    checkRedeemTimer
};
import axios from 'axios';

// Configuración base de Axios
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/api/chromas`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images`;
const API_BASE_LOOTBOX = `${import.meta.env.VITE_API_URL}/lootbox`;

// Obtener ID del usuario autenticado
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    return user ? user._id : null;
};

// Función para manejar errores
const handleRequestError = (error) => {
    console.error('Error en la solicitud:', error);
    throw error;
};

// Transformar datos de la lootbox
const transformItemImageUrl = (item) => {
    if (!item) return null;
    const baseUrl = item.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    return {
        ...item,
        srcLocal: item.srcLocal ? `${baseUrl}/${item.srcLocal.replace(/\\/g, '/')}` : null
    };
};

// Transformar URLs de skins
const transformSkinImageUrl = (skin) => {
    if (!skin) return null;
    return {
        ...skin,
        srcLocal: skin.srcLocal ? `${API_BASE_IMAGE}${skin.srcLocal.replace(/\\/g, '/')}` : null
    };
};

// Transformar datos de la lootbox
const transformLootboxData = (lootbox) => {
    if (!lootbox) return null;

    return {
        ...lootbox,
        image: lootbox.image ? `${API_BASE_LOOTBOX}/${lootbox.image}` : null,
        items: lootbox.items.map(item => ({
            ...item,
            dropRateFormatted: `${item.dropRate}%`,
            itemId: item.itemId ? (
                item.itemType === 'Skin' 
                    ? transformSkinImageUrl(item.itemId)
                    : transformItemImageUrl(item.itemId)
            ) : null
        }))
    };
};

// Funciones de gestión de lootboxes
export const createLootbox = async (formData) => {
    try {
      const response = await api.post('/lootboxes/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return transformLootboxData(response.data);
    } catch (error) {
      handleRequestError(error);
    }
  };

// Obtener todas las lootboxes (admin)
export const getAllLootboxes = async (includeInactive = false) => {
    try {
        const response = await api.get('/lootboxes', {
            params: { active: includeInactive }
        });
        return response.data.map(transformLootboxData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener lootboxes disponibles para el usuario
export const getAvailableLootboxes = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/lootboxes/available/${userId}`);
        return response.data.map(transformLootboxData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener una lootbox específica
export const getLootboxById = async (id) => {
    try {
        const response = await api.get(`/lootboxes/${id}`);
        return transformLootboxData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Actualizar una lootbox
export const updateLootbox = async (id, formData) => {
    try {
      const response = await api.put(`/lootboxes/edit/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return transformLootboxData(response.data);
    } catch (error) {
      handleRequestError(error);
    }
  };

// Desactivar una lootbox
export const deactivateLootbox = async (id) => {
    try {
        const response = await api.put(`/lootboxes/deactivate/${id}`);
        return transformLootboxData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Abrir una lootbox
export const openLootbox = async (lootboxId) => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.post(`/lootboxes/open/${lootboxId}`, { userId });
        return {
            ...response.data,
            itemReceived: {
                ...response.data.itemReceived,
                dropAnimation: true // Flag para animaciones en el frontend
            }
        };
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener historial de lootboxes abiertas
export const getLootboxHistory = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/lootboxes/history/${userId}`);
        return response.data.map(purchase => ({
            ...purchase,
            openedAt: new Date(purchase.purchaseDate).toLocaleString(),
        }));
    } catch (error) {
        handleRequestError(error);
    }
};

// Verificar si el usuario puede abrir una lootbox específica
export const canOpenLootbox = async (lootboxId) => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const [lootbox, user] = await Promise.all([
            getLootboxById(lootboxId),
            // Asumiendo que tienes un servicio para obtener el usuario actual
            getUserDetails(userId)
        ]);

        return {
            hasEnoughGold: user.gold >= lootbox.price,
            meetsRankRequirement: !lootbox.minimumRank || user.rank.level >= lootbox.minimumRank.level,
            isActive: lootbox.active,
            isExpired: lootbox.endDate ? new Date(lootbox.endDate) < new Date() : false
        };
    } catch (error) {
        handleRequestError(error);
    }
};

export default {
    createLootbox,
    getAllLootboxes,
    getAvailableLootboxes,
    getLootboxById,
    updateLootbox,
    deactivateLootbox,
    openLootbox,
    getLootboxHistory,
    canOpenLootbox
};
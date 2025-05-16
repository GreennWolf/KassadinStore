import axios from 'axios';
import { getUpdatedUser } from './userService';

// Configuración base de Axios
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Definimos constantes para URLs base (útiles para transformar imágenes)
const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/api/chromas`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images/`;
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

// Transformar datos para Items (cuando sea 'Item') => Armado de URL de imagen
const transformItemImageUrl = (item) => {
  if (!item) return null;
  const baseUrl = item.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
  return {
    ...item,
    srcLocal: item.srcLocal ? `${baseUrl}/${item.srcLocal.replace(/\\/g, '/')}` : null
  };
};

// Transformar datos para Skins => Armado de URL de imagen
const transformSkinImageUrl = (skin) => {
  if (!skin) return null;
  return {
    ...skin,
    srcLocal: skin.srcLocal ? `${API_BASE_IMAGE}${skin.srcLocal.replace(/\\/g, '/')}` : null
  };
};

// Transformar details de un item recibido
const transformItemDetails = (itemReceived) => {
  if (!itemReceived) return null;

  // Copia base del item
  const transformedItem = { ...itemReceived };

  // Dependiendo del tipo, transformamos las URLs
  if (itemReceived.itemType === 'Skin') {
    // Para Skins
    if (transformedItem.details && transformedItem.details.srcLocal) {
      transformedItem.details = {
        ...transformedItem.details,
        srcLocal: `${API_BASE_IMAGE}${transformedItem.details.srcLocal.replace(/\\/g, '/')}`
      };
    }
    
    // También verificamos si hay itemId con datos de skin
    if (transformedItem.itemId && typeof transformedItem.itemId === 'object') {
      transformedItem.itemId = transformSkinImageUrl(transformedItem.itemId);
    }
  } 
  else if (itemReceived.itemType === 'Item') {
    // Para Items
    if (transformedItem.details && transformedItem.details.srcLocal) {
      const baseUrl = transformedItem.details.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
      transformedItem.details = {
        ...transformedItem.details,
        srcLocal: `${baseUrl}/${transformedItem.details.srcLocal.replace(/\\/g, '/')}`
      };
    }
    
    // También verificamos si hay itemId con datos
    if (transformedItem.itemId && typeof transformedItem.itemId === 'object') {
      transformedItem.itemId = transformItemImageUrl(transformedItem.itemId);
    }
  } 
  else if (itemReceived.itemType === 'RewardCouponPreset') {
    // Para cupones, si tienen alguna imagen específica
    if (transformedItem.details && transformedItem.details.image && !transformedItem.details.image.startsWith('http')) {
      transformedItem.details = {
        ...transformedItem.details,
        image: `${API_BASE_IMAGE}${transformedItem.details.image.replace(/\\/g, '/')}`
      };
    }
  } 
  else if (itemReceived.itemType === 'FragmentsPreset') {
    // Para fragmentos, si tienen alguna imagen específica
    if (transformedItem.details && transformedItem.details.image && !transformedItem.details.image.startsWith('http')) {
      transformedItem.details = {
        ...transformedItem.details,
        image: `${API_BASE_IMAGE}${transformedItem.details.image.replace(/\\/g, '/')}`
      };
    }
  }

  return transformedItem;
};

// Transformar datos completos de la lootbox
const transformLootboxData = (lootbox) => {
  if (!lootbox) return null;
  
  return {
    ...lootbox,
    image: lootbox.image ? `${API_BASE_LOOTBOX}/${lootbox.image}` : null,
    items: lootbox.items.map(item => ({
      ...item,
      dropRateFormatted: `${item.dropRate}%`,
      itemId: item.itemId
        ? (
            item.itemType === 'Skin'
              ? transformSkinImageUrl(item.itemId)
              : item.itemType === 'Item'
                ? transformItemImageUrl(item.itemId)
                : item.itemId // <- si es "RewardCouponPreset" u otro, no se transforma
          )
        : null
    }))
  };
};
/* =======================================================
   Funciones de gestión de Lootboxes (ADMIN y USUARIO)
   ======================================================= */

// 1. Crear lootbox (ADMIN)
export const createLootbox = async (formData) => {
  try {
    // POST /lootboxes/create con multipart/form-data
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

// 2. Obtener todas las lootboxes (ADMIN), con parámetro para inactivas
export const getAllLootboxes = async (includeInactive = false) => {
  try {
    // Si includeInactive=true => traemos lootboxes con active=false
    // Ajusta la lógica según tus necesidades
    const response = await api.get('/lootboxes', {
      params: { active: includeInactive }
    });
    return response.data.map(transformLootboxData);
  } catch (error) {
    handleRequestError(error);
  }
};

// 3. Obtener lootboxes disponibles para un usuario
export const getAvailableLootboxes = async () => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  try {
    // GET /lootboxes/available/:userId
    const response = await api.get(`/lootboxes/available/${userId}`);
    return response.data.map(transformLootboxData);
  } catch (error) {
    handleRequestError(error);
  }
};

// 4. Obtener una lootbox por ID
export const getLootboxById = async (id) => {
  try {
    // GET /lootboxes/:id
    const response = await api.get(`/lootboxes/${id}`);
    return transformLootboxData(response.data);
  } catch (error) {
    handleRequestError(error);
  }
};

// 5. Actualizar lootbox (ADMIN)
export const updateLootbox = async (id, formData) => {
  try {
    // PUT /lootboxes/edit/:id con multipart/form-data
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

// 6. Desactivar lootbox (ADMIN)
export const deactivateLootbox = async (id) => {
  try {
    // PUT /lootboxes/deactivate/:id
    const response = await api.put(`/lootboxes/deactivate/${id}`);
    return transformLootboxData(response.data);
  } catch (error) {
    handleRequestError(error);
  }
};

// 7. Abrir lootbox (USUARIO)
export const openLootbox = async (lootboxId) => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  try {
    // POST /lootboxes/open/:lootboxId
    const response = await api.post(`/lootboxes/open/${lootboxId}`, { userId });
    
    // Actualizar el usuario para reflejar cambios en oro
    getUpdatedUser(userId,true);
    
    // Transformar los datos del item recibido para URLs correctas
    const transformedItemReceived = transformItemDetails(response.data.itemReceived);
    
    // console.log("Item transformado:", transformedItemReceived);
    
    // Retornamos data con un flag para animaciones e item transformado
    return {
      ...response.data,
      itemReceived: {
        ...transformedItemReceived,
        dropAnimation: true
      }
    };
    
  } catch (error) {
    handleRequestError(error);
  }
};

// 8. Obtener historial de lootboxes abiertas (USUARIO)
export const getLootboxHistory = async () => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  try {
    // GET /lootboxes/history/:userId
    const response = await api.get(`/lootboxes/history/${userId}`);
    
    // Transformamos también las URLs en el historial
    const transformedHistory = response.data.map(purchase => ({
      ...purchase,
      openedAt: new Date(purchase.purchaseDate).toLocaleString(),
      itemReceived: transformItemDetails(purchase.itemReceived)
    }));
    
    return transformedHistory;
  } catch (error) {
    handleRequestError(error);
  }
};

// 9. Verificar si el usuario puede abrir una lootbox específica (opcional, FRONT)
export const canOpenLootbox = async (lootboxId, getUserDetails) => {
  const userId = getUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado.');
  }

  try {
    // Si deseas pre-verificar en frontend (opcional)
    const [lootbox, user] = await Promise.all([
      getLootboxById(lootboxId),
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

// Exportar todo en un objeto por si deseas importarlo como default
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
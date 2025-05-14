// services/inventoryService.js
import axios from 'axios';
import { getUpdatedUser } from './userService';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/inventory`;
const API_BASE_ITEMS = `${import.meta.env.VITE_API_URL}/items`;
const API_BASE_CHROMAS = `${import.meta.env.VITE_API_URL}/api/chromas`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images`;
const API_BASE_FRAGMENTS = `${import.meta.env.VITE_API_URL}/api/fragments`;

/**
 * Función para obtener el userId del localStorage
 */
const getUserId = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  return user ? user._id : null;
};

/**
 * Manejador de errores centralizado
 */
const handleError = (error, defaultMessage) => {
  console.error(defaultMessage, error);
  if (error.message === 'Usuario no autenticado') {
    throw new Error('Debes iniciar sesión para realizar esta acción');
  }
  if (error.response?.data?.message) {
    throw new Error(error.response.data.message);
  } else if (error.response) {
    throw new Error(defaultMessage);
  } else if (error.request) {
    throw new Error('No se recibió respuesta del servidor');
  } else {
    throw new Error(error.message || defaultMessage);
  }
};

/**
 * Transformar URLs para Skin/Item/FragmentsUser
 */
const transformImageUrls = (item) => {
  if (!item) return item;

  const transformedItem = { ...item };
  
  // Si es FragmentsUser, aseguramos que tenga una estructura válida incluso si no está populado
  if (transformedItem.itemType === 'FragmentsUser') {
    // Si itemId no está populado o es null, creamos un objeto básico
    if (!transformedItem.itemId || typeof transformedItem.itemId !== 'object') {
      transformedItem.itemId = {
        _id: transformedItem.itemId,
        name: transformedItem.details?.fragmentName || "Fragmento",
        srcLocal: null
      };
    }
    
    // Añadimos datos de fragmento para la UI
    const fragmentDetails = transformedItem.details || {};
    transformedItem.itemId = {
      ...transformedItem.itemId,
      name: fragmentDetails.fragmentName || transformedItem.itemId.name || "Fragmento",
      fragmentId: fragmentDetails.fragmentId,
      requiredQuantity: fragmentDetails.requiredQuantity || 1,
      currentQuantity: fragmentDetails.currentQuantity || 0,
      rewardType: fragmentDetails.rewardType || "item"
    };
    
    return transformedItem;
  }
  
  // Si itemId es nulo o no es un objeto, no hay nada más que hacer
  if (!transformedItem.itemId || typeof transformedItem.itemId !== 'object') {
    return transformedItem;
  }
  
  if (transformedItem.itemType === 'Item') {
    const itemDetails = transformedItem.itemId;
    const baseUrl = itemDetails.type === 'chromas' ? API_BASE_CHROMAS : API_BASE_ITEMS;
    transformedItem.itemId = {
      ...itemDetails,
      srcLocal: itemDetails.srcLocal ? `${baseUrl}/${itemDetails.srcLocal.replace(/\\/g, '/')}` : null,
      srcWeb: itemDetails.srcWeb || null
    };
  } else if (transformedItem.itemType === 'Skin') {
    const skinDetails = transformedItem.itemId;
    transformedItem.itemId = {
      ...skinDetails,
      srcLocal: skinDetails.srcLocal ? `${API_BASE_IMAGE}/${skinDetails.srcLocal.replace(/\\/g, '/')}` : null,
      src: skinDetails.src || null
    };
  } else if (transformedItem.itemType === 'FragmentsPreset') {
    // Aseguramos que los datos del FragmentsPreset tengan estructura consistente
    const fragmentDetails = transformedItem.itemId;
    transformedItem.itemId = {
      ...fragmentDetails,
      name: fragmentDetails.name || "Fragmento",
      requiredQuantity: fragmentDetails.requiredQuantity || 1
    };
  }
  
  return transformedItem;
};

/**
 * Transformar arrays de items con manejo seguro de nulos
 */
const transformItemsArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items.map(item => transformImageUrls(item));
};

// =============================
// 1. Inventario: Items Activos, Usados, Historial
// =============================
export const getActiveItems = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.get(`${API_BASE_URL}/active/${userId}`);
    
    // Log para depuración
    console.log('Items recibidos del servidor:', response.data.items);
    
    // Transformar los items
    const transformedItems = transformItemsArray(response.data.items);
    
    // Log para depuración
    console.log('Items transformados:', transformedItems);
    
    return {
      ...response.data,
      items: transformedItems
    };
  } catch (error) {
    handleError(error, 'Error al obtener los items activos del inventario');
    throw error;
  }
};

export const getUsedItems = async (params = {}) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.get(`${API_BASE_URL}/used/${userId}`, { params });
    return {
      ...response.data,
      items: transformItemsArray(response.data.items)
    };
  } catch (error) {
    handleError(error, 'Error al obtener los items usados del inventario');
    throw error;
  }
};

export const getInventoryHistory = async (params = {}) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.get(`${API_BASE_URL}/history/${userId}`, { params });
    return {
      ...response.data,
      items: transformItemsArray(response.data.items)
    };
  } catch (error) {
    handleError(error, 'Error al obtener el historial del inventario');
    throw error;
  }
};

// =============================
// 2. Verificar/Comprar/Usar Item
// =============================
export const canPurchaseItem = async (purchaseData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');
    
    const response = await axios.post(`${API_BASE_URL}/can-purchase`, {
      ...purchaseData,
      userId
    });
    return response.data;
  } catch (error) {
    handleError(error, 'Error al verificar la compra');
    throw error;
  }
};

export const purchaseItem = async (purchaseData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.post(`${API_BASE_URL}/purchase`, {
      ...purchaseData,
      userId
    });
    // Actualizar datos del usuario local (por si cambia el oro)
    getUpdatedUser(userId,true);

    return {
      ...response.data,
      inventory: {
        ...response.data.inventory,
        activeItems: transformItemsArray(response.data.inventory.activeItems)
      }
    };
  } catch (error) {
    handleError(error, 'Error al realizar la compra');
    throw error;
  }
};

export const getRewardCouponsByUserId = async () => {
  try {
      const userId = JSON.parse(localStorage.getItem("user"))?._id;
      if (!userId) throw new Error("Usuario no autenticado");

      const response = await axios.get(`${API_BASE_URL}/coupons/${userId}`);
      return response.data;
  } catch (error) {
      console.error("Error al obtener los cupones reclamados:", error);
      throw error;
  }
};

export const useItem = async (useData) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.post(`${API_BASE_URL}/use`, {
      ...useData,
      userId
    });

    return {
      ...response.data,
      inventory: {
        ...response.data.inventory,
        activeItems: transformItemsArray(response.data.inventory.activeItems),
        usedItems: transformItemsArray(response.data.inventory.usedItems)
      }
    };
  } catch (error) {
    handleError(error, 'Error al usar el item');
    throw error;
  }
};

// =============================
// 3. Reward Coupons: claim, get, use
// =============================

/**
 * claimRewardCoupon ahora espera recibir un objeto { presetId, entryId }.
 * Se asegura de enviar presetId como cadena y envía userId, presetId y entryId al endpoint.
 */
export const claimRewardCoupon = async ({ presetId, entryId }) => {
  try {
      const userId = JSON.parse(localStorage.getItem("user"))?._id;
      if (!userId) throw new Error("Usuario no autenticado");

      // Aseguramos que presetId sea una cadena:
      const presetIdStr = typeof presetId === "string" ? presetId : presetId._id.toString();

      const response = await axios.post(`${API_BASE_URL}/claim-reward-coupon`, {
          userId,
          presetId: presetIdStr,
          entryId
      });

      return response.data;
  } catch (error) {
      console.error("Error al reclamar el cupón de recompensa:", error);
      throw error;
  }
};

export const getUserRewardCoupons = async () => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.get(`${API_BASE_URL}/coupons/${userId}`);
    return response.data;
  } catch (error) {
    handleError(error, 'Error al obtener los cupones de recompensa del usuario');
    throw error;
  }
};

export const useRewardCoupon = async (couponId) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/use-reward-coupon/${couponId}`);
    return response.data;
  } catch (error) {
    handleError(error, 'Error al usar el cupón de recompensa');
    throw error;
  }
};

// =============================
// 4. Fragmentos: obtener, reclamar
// =============================
export const getFragmentData = async (fragmentId) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    const response = await axios.get(`${API_BASE_FRAGMENTS}/${fragmentId}?userId=${userId}`);
    return response.data;
  } catch (error) {
    handleError(error, 'Error al obtener información del fragmento');
    throw error;
  }
};

/**
 * Función para canjear fragmentos usando el fragmentPresetId
 * @param {string} fragmentPresetId - ID del fragmento preset (NO el fragmentUserId)
 * @returns {Promise<Object>} Respuesta con detalles de la recompensa obtenida
 */
export const claimFragmentReward = async (fragmentPresetId) => {
  try {
    const userId = getUserId();
    if (!userId) throw new Error('Usuario no autenticado');

    console.log(`Enviando solicitud de canje de fragmento. UserId: ${userId}, FragmentPresetId: ${fragmentPresetId}`);
    
    const response = await axios.post(`${API_BASE_URL}/claimFragment`, {
      userId,
      fragmentPresetId
    });
    
    // Actualizar datos del usuario local (por si cambia algún estado)
    getUpdatedUser(userId,true);
    
    // Crear una respuesta más amigable para el frontend
    const result = {
      success: response.data.success,
      message: response.data.message
    };

    // Si hay un item de inventario en la respuesta, incluirlo
    if (response.data.inventoryItem) {
      // Transformar URLs si es necesario
      result.inventoryItem = transformImageUrls(response.data.inventoryItem);
    }

    // Si hay un cupón en la respuesta, incluirlo
    if (response.data.coupon) {
      result.coupon = response.data.coupon;
    }
    
    console.log("Respuesta del canje de fragmento:", result);
    
    return result;
  } catch (error) {
    console.error("Error detallado al canjear fragmentos:", error.response?.data || error.message);
    handleError(error, 'Error al canjear los fragmentos');
    throw error;
  }
};

export default {
  getActiveItems,
  getUsedItems,
  getInventoryHistory,
  canPurchaseItem,
  purchaseItem,
  useItem,
  claimRewardCoupon,
  getUserRewardCoupons,
  useRewardCoupon,
  getRewardCouponsByUserId,
  getFragmentData,
  claimFragmentReward
};
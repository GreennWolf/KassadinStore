import axios from 'axios';
import { useState , useEffect } from 'react';
import { getUpdatedUser } from './userService';

// Configuración base de Axios
const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// URL base para recibos
const API_BASE_RECEIPT = `${import.meta.env.VITE_API_URL}/receipts/`;

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

// Transformar datos de la compra con manejo de timer
const transformPurchaseData = (purchase) => {
    const transformed = purchase.receipt
        ? {
            ...purchase,
            receiptUrl: new URL(purchase.receipt, API_BASE_RECEIPT).href,
        }
        : purchase;

    if (transformed.timerEndTime) {
        transformed.timeRemaining = new Date(transformed.timerEndTime).getTime() - Date.now();
    }

    if (transformed.items) {
        transformed.items = transformed.items.map(item => ({
            ...item,
            isSkin: item.isSkin ?? false,
            // Asegurarnos de que accountData está disponible si existe
            accountData: item.accountData || null
        }));
    }

    return transformed;
};

const compressImage = async (file) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1920;
                const MAX_HEIGHT = 1080;
                let width = img.width;
                let height = img.height;

                // Calcular las nuevas dimensiones manteniendo el aspect ratio
                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height = height * (MAX_WIDTH / width);
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width = width * (MAX_HEIGHT / height);
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Convertir a Blob con calidad reducida
                canvas.toBlob(
                    (blob) => {
                        // Crear un nuevo archivo con el mismo nombre pero comprimido
                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(optimizedFile);
                    },
                    'image/jpeg',
                    0.7 // Calidad de la imagen (0.7 = 70%)
                );
            };
        };
    });
};

// Crear una nueva compra
export const createPurchase = async (data) => {
    // console.log('PURCHASESERVICE - Iniciando createPurchase');
    const userId = getUserId();
    // console.log('PURCHASESERVICE - ID del usuario:', userId);
    
    const {items, paymentMethodId, riotName, discordName, region, selectedCurrency, cupon, file, orderId, orderType} = data;
    // console.log('PURCHASESERVICE - Items recibidos:', items ? items.length : 0, 'items');
    
    // Verificar si hay unrankeds en los items SOLO si hay items
    let unrankedItems = [];
    if (items && Array.isArray(items)) {
        unrankedItems = items.filter(item => item.isUnranked === true || item.itemType === 'Unranked');
        // console.log('PURCHASESERVICE - Items unranked encontrados:', unrankedItems.length);
        if (unrankedItems.length > 0) {
            // console.log('PURCHASESERVICE - Detalles de items unranked:', JSON.stringify(unrankedItems));
        }
    }

    if (!userId) {
        console.error('PURCHASESERVICE - Error: Usuario no autenticado');
        throw new Error('Usuario no autenticado.');
    }

    // console.log('PURCHASESERVICE - Creando FormData');
    const formData = new FormData();
    formData.append('userId', userId);
    
    // Si es una orden normal, añadir items
    if (!orderType || orderType !== 'eloboost') {
        // console.log('PURCHASESERVICE - Agregando items al FormData');
        formData.append('items', JSON.stringify(items));
    }
    
    // Si es una orden de tipo eloboost, añadir orderId
    if (orderType === 'eloboost' && orderId) {
        // console.log('PURCHASESERVICE - Orden tipo eloboost detectada');
        formData.append('orderId', orderId);
        formData.append('orderType', orderType);
    }
    
    formData.append('paymentMethodId', paymentMethodId);
    formData.append('riotName', riotName);
    formData.append('discordName', discordName);
    formData.append('region', region);
    formData.append('selectedCurrency', selectedCurrency);
    formData.append('cuponId', cupon);
    // console.log('PURCHASESERVICE - FormData creado con éxito');

    // Comprimir la imagen si es una imagen
    if (file) {
        // console.log('PURCHASESERVICE - Procesando archivo de recibo');
        const fileType = file.type.split('/')[0];
        if (fileType === 'image') {
            try {
                // console.log('PURCHASESERVICE - Comprimiendo imagen');
                const optimizedFile = await compressImage(file);
                formData.append('receipt', optimizedFile);
                // console.log('PURCHASESERVICE - Imagen comprimida con éxito');
            } catch (error) {
                console.error('PURCHASESERVICE - Error comprimiendo imagen:', error);
                formData.append('receipt', file); // Si falla la compresión, usar archivo original
            }
        } else {
            // console.log('PURCHASESERVICE - Agregando archivo sin comprimir');
            formData.append('receipt', file); // Si no es imagen, usar archivo original
        }
    }

    try {
        // console.log('PURCHASESERVICE - Enviando solicitud al servidor');
        // console.log('PURCHASESERVICE - URL:', `${import.meta.env.VITE_API_URL}/api/purchases/create`);
        
        const response = await api.post('/purchases/create', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            withCredentials: true, // Importante para CORS
        });
        
        // console.log('PURCHASESERVICE - Respuesta recibida del servidor:', response.status);
        // console.log('PURCHASESERVICE - ID de la compra creada:', response.data._id);
        
        // Si hay unranked items, mostrar detalles de la respuesta
        if (unrankedItems.length > 0) {
            // console.log('PURCHASESERVICE - Items en la respuesta:', response.data.items ? response.data.items.length : 0);
            // console.log('PURCHASESERVICE - Estado de la compra:', response.data.status?.statusId);
        }
        
        // console.log('PURCHASESERVICE - Actualizando usuario');
        await getUpdatedUser(userId, true);
        
        // Tracking de evento de compra
        if (typeof fbq === 'function') {
            // console.log('PURCHASESERVICE - Registrando evento de Facebook Pixel');
            fbq('track', 'Purchase', { 
                value: response.data.Total, 
                currency: response.data.currencyId,
                content_ids: response.data.items ? response.data.items.map(item => item.name || item.itemId) : [orderId], 
                content_type: 'product' 
            });
        }
        
        // Si es una orden de tipo eloboost, vincular el pago con la orden
        if (orderType === 'eloboost' && orderId && response.data._id) {
            try {
                // console.log("PURCHASESERVICE - Intentando vincular EloBoost orden:", orderId, "con pago:", response.data._id);
                await axios.post(`${import.meta.env.VITE_API_URL}/api/eloboost/orders/link-payment`, {
                    orderId: orderId,
                    paymentId: response.data._id,
                    userId: userId
                });
            } catch (linkError) {
                console.error('PURCHASESERVICE - Error al vincular pago con orden de EloBoost:', linkError);
                // No lanzamos error para permitir que la compra se complete
            }
        }
        
        // console.log('PURCHASESERVICE - Compra creada exitosamente');
        return transformPurchaseData(response.data);
    } catch (error) {
        console.error('PURCHASESERVICE - Error creando compra:', error);
        console.error('PURCHASESERVICE - Detalles del error:', error.response?.data);
        handleRequestError(error);
    }
};

// Obtener todas las compras
export const getAllPurchases = async () => {
    try {
        const response = await api.get('/purchases/getAll');
        return response.data.map(transformPurchaseData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener una compra por ID
export const getPurchaseById = async (id) => {
    try {
        const response = await api.get(`/purchases/get/${id}`);
        return transformPurchaseData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

// Actualizar una compra existente
export const updatePurchase = async (id, updates) => {
    try {
        // console.log('=== INICIANDO UPDATEPURCHASE EN SERVICIO ===');
        // console.log('ID de la orden:', id);
        // console.log('Actualizaciones:', JSON.stringify(updates));
        
        if (updates.items) {
            updates.items = updates.items.map(item => ({
                ...item,
                isSkin: item.isSkin ?? false,
            }));
        }

        // console.log('Enviando solicitud PUT a:', `/purchases/edit/${id}`);
        // console.log('Cuerpo de la solicitud:', JSON.stringify(updates));
        
        const response = await api.put(`/purchases/edit/${id}`, updates);
        // console.log('Respuesta del servidor:', JSON.stringify({
            status: response.status,
            statusText: response.statusText,
            data: response.data ? 'Datos recibidos' : 'Sin datos',
        }));
        
        // console.log('=== FIN UPDATEPURCHASE EN SERVICIO ===');
        return transformPurchaseData(response.data);
    } catch (error) {
        console.error('Error en updatePurchase:', error);
        console.error('Detalles del error:', error.message);
        console.error('Stack trace:', error.stack);
        console.error('Respuesta del servidor:', error.response?.data);
        handleRequestError(error);
    }
};

// Eliminar una compra
export const deletePurchase = async (id) => {
    try {
        await api.delete(`/purchases/delete/${id}`);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener detalles de los items
export const getItemsDetails = async (items) => {
    const itemPromises = items.map(async (item) => {
        const endpoint = item.itemType === 'Skin' ? '/skins/get/' : '/items/get/';

        try {
            const response = await api.get(`${endpoint}${item.itemId}`);
            return { ...response.data, itemType: item.itemType, quantity: item.quantity };
        } catch (error) {
            console.error(`Error al obtener detalles del item ${item.itemId}:`, error);
            return { error: true, itemId: item.itemId, quantity: item.quantity, itemType: item.itemType };
        }
    });

    try {
        return await Promise.all(itemPromises);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener compras del usuario
export const getTotalPurchases = async (userId) => {
    try {
        const response = await api.get(`/purchases/getTotalPurchases/${userId}`);
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const getUnreadPurchases = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/purchases/unread/${userId}`);
        return response.data.map(transformPurchaseData);
    } catch (error) {
        handleRequestError(error);
    }
};

export const markStatusAsViewed = async (purchaseId) => {
    try {
        const response = await api.put(`/purchases/markViewed/${purchaseId}`);
        return transformPurchaseData(response.data);
    } catch (error) {
        handleRequestError(error);
    }
};

export const getUnreadCount = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/purchases/unreadCount/${userId}`);
        return response.data.count;
    } catch (error) {
        handleRequestError(error);
    }
};

// Funciones de gestión de estado
export const createStatus = async (data) => {
    try {
        const { 
            status, 
            defaultValue, 
            description, 
            color, 
            confirmacion, 
            confirmacionText,
            confirmationAction 
        } = data;

        const response = await api.post('/purchases/status/create', { 
            status, 
            defaultValue, 
            description, 
            color, 
            confirmacion, 
            confirmacionText,
            confirmationAction
        });
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const getAllStatus = async () => {
    try {
        const response = await api.get('/purchases/status/getAll');
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const getStatusById = async (id) => {
    try {
        const response = await api.get(`/purchases/status/get/${id}`);
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const updateStatus = async (id, updates) => {
    try {
        // Validar formato de las acciones antes de enviar
        if (updates.confirmationAction) {
            if (updates.confirmationAction.type === 'startTimer') {
                // Asegurarse de que el tiempo sea un número
                updates.confirmationAction.config.time = Number(updates.confirmationAction.config.time);
                
                if (isNaN(updates.confirmationAction.config.time) || updates.confirmationAction.config.time <= 0) {
                    throw new Error('El tiempo debe ser un número positivo');
                }
            }
        }

        const response = await api.put(`/purchases/status/edit/${id}`, updates);
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const deleteStatus = async (id) => {
    try {
        await api.delete(`/purchases/status/delete/${id}`);
    } catch (error) {
        handleRequestError(error);
    }
};

export const confirmPurchaseStatus = async (purchaseId) => {
    try {
        const response = await api.post(`/purchases/confirm/${purchaseId}`);
        if (!response.data.purchase) {
            return transformPurchaseData(response.data);
        }
        return transformPurchaseData(response.data.purchase);
    } catch (error) {
        handleRequestError(error);
    }
};

// Obtener compras que necesitan confirmación
export const getPurchasesNeedingConfirmation = async () => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/purchases/need-confirmation/${userId}`);
        return response.data.map(transformPurchaseData);
    } catch (error) {
        handleRequestError(error);
    }
};

// Función auxiliar para chequear el temporizador de una compra
export const checkPurchaseTimer = (purchase) => {
    if (!purchase.timerEndTime) return null;
    
    const now = Date.now();
    const endTime = new Date(purchase.timerEndTime).getTime();
    
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


export const chargeAccountData = async (purchaseId, itemId, accountData) => {
    try {
        const response = await api.patch(
            `/purchases/${purchaseId}/items/${itemId}/account`,
            {
                email: accountData.email,
                password: accountData.password
            }
        );
        return transformPurchaseData(response.data.purchase);
    } catch (error) {
        handleRequestError(error);
    }
};

export const checkCuponUsage = async (cuponId) => {
    const userId = getUserId();
    if (!userId) {
        throw new Error('Usuario no autenticado.');
    }

    try {
        const response = await api.get(`/purchases/check-cupon/${userId}/${cuponId}`);
        return response.data;
    } catch (error) {
        handleRequestError(error);
    }
};

export const simulatePurchaseProgress = async (items) => {
    const userId = getUserId();
    if (!userId) {
      throw new Error('Usuario no autenticado.');
    }
  
    try {
      const response = await api.post('/purchases/simulate-progress', {
        userId,
        items
      });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  };

  export const processUserProgress = async (purchaseId, x2 = false) => {
    try {
      const response = await api.post(`/purchases/${purchaseId}/process-progress`, { x2 });
      return response.data;
    } catch (error) {
      handleRequestError(error);
    }
  };


export default {
    createPurchase,
    getAllPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getItemsDetails,
    createStatus,
    getAllStatus,
    getStatusById,
    updateStatus,
    deleteStatus,
    getUnreadPurchases,
    markStatusAsViewed,
    getUnreadCount,
    getPurchasesNeedingConfirmation,
    confirmPurchaseStatus,
    checkPurchaseTimer,
    chargeAccountData,
    checkCuponUsage,
    simulatePurchaseProgress,
    processUserProgress
};

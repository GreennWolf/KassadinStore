import axios from 'axios';

// Obtener la URL base de la API desde las variables de entorno
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configuraciones de rutas relacionadas con Elo Boost
const ELOBOOST_URL = `${API_URL}/api/eloboost`;

// Función helper para obtener el token de autenticación
const getAuthToken = () => {
  // Intentar primero con localStorage.getItem('token')
  const directToken = localStorage.getItem('token');
  console.log('Token directo de localStorage:', directToken);
  
  if (directToken) return directToken;
  
  // Si no está disponible, intentar extraerlo del objeto user
  const userJson = localStorage.getItem('user');
  console.log('User JSON de localStorage:', userJson);
  
  if (!userJson) return null;
  
  try {
    const user = JSON.parse(userJson);
    console.log('User parseado:', user);
    console.log('Token del user:', user?.token);
    return user?.token || null;
  } catch (error) {
    console.error('Error parsing user JSON:', error);
    return null;
  }
};

// Funciones para rangos y divisiones
export const getEloBoostRanks = async () => {
  try {
    const response = await axios.get(`${ELOBOOST_URL}/ranks`);
    return response.data;
  } catch (error) {
    console.error('Error fetching EloBoost ranks:', error);
    throw error;
  }
};

export const getEloBoostConfig = async () => {
  try {
    const response = await axios.get(`${ELOBOOST_URL}/config`);
    return response.data;
  } catch (error) {
    console.error('Error fetching EloBoost config:', error);
    throw error;
  }
};

export const getAvailableChampions = async () => {
  try {
    const response = await axios.get(`${ELOBOOST_URL}/champions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching available champions:', error);
    throw error;
  }
};

// Cálculo de precios
export const calculateBoostCost = async (boostData) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    // Añadir el userId a los datos
    const dataWithUserId = {
      ...boostData,
      userId
    };
    
    const response = await axios.post(`${ELOBOOST_URL}/calculate`, dataWithUserId);
    return response.data;
  } catch (error) {
    console.error('Error calculating boost cost:', error);
    throw error;
  }
};

// Obtener conversiones de precios para EloBoost
export const getEloBoostPriceConversions = async () => {
  try {
    const response = await axios.get(`${ELOBOOST_URL}/price-conversions`);
    return response.data;
  } catch (error) {
    console.error('Error fetching EloBoost price conversions:', error);
    throw error;
  }
};

// Funciones de órdenes para usuarios
export const createEloBoostOrder = async (orderData, token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Añadir el userId a los datos
    const dataWithUserId = {
      ...orderData,
      userId
    };
    
    // Configurar el encabezado de autenticación
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.post(`${ELOBOOST_URL}/orders`, dataWithUserId, config);
    return response.data;
  } catch (error) {
    console.error('Error creating EloBoost order:', error);
    throw error;
  }
};

export const getUserEloBoostOrders = async (token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        userId
      }
    };
    
    const response = await axios.get(`${ELOBOOST_URL}/my-orders`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching user EloBoost orders:', error);
    throw error;
  }
};

export const getEloBoostOrderById = async (orderId, token) => {
  try {
    // Verificar si es una solicitud con autenticación o pública
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    let response;
    
    if (userId) {
      // Si hay usuario autenticado, usamos la ruta autenticada con userId
      // Obtener token desde localStorage si no se proporcionó
      const authToken = token || localStorage.getItem('token');
      
      if (!authToken) {
        throw new Error('Token de autenticación no encontrado');
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${authToken}`
        },
        params: {
          userId
        }
      };
      
      response = await axios.get(`${ELOBOOST_URL}/my-orders/${orderId}`, config);
    } else {
      // Si no hay usuario autenticado (como en el checkout público),
      // usamos la ruta pública que no requiere autenticación
      response = await axios.get(`${ELOBOOST_URL}/orders/${orderId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('Error fetching EloBoost order details:', error);
    throw error;
  }
};

export const updateAccountDetails = async (orderId, accountDetails, token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    // Añadir el userId a los datos
    const detailsWithUserId = {
      ...accountDetails,
      userId
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await axios.put(
      `${ELOBOOST_URL}/orders/${orderId}/account`, 
      detailsWithUserId,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Error updating account details:', error);
    throw error;
  }
};

// Confirmar solicitud de duo
export const confirmDuoRequest = async (orderId) => {
  try {
    const token = getAuthToken();
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const response = await axios.post(
      `${ELOBOOST_URL}/orders/${orderId}/confirm-duo`, 
      {}, 
      config
    );
    return response.data;
  } catch (error) {
    console.error('Error confirming duo request:', error);
    throw error;
  }
};

// Funciones para administradores
export const createEloBoostRank = async (rankData) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token usando la función helper
    const authToken = getAuthToken();
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    // Crear el FormData
    const formData = new FormData();
    
    // Añadir userId a los datos
    formData.append('userId', userId);
    
    // Agregar datos del rango al formulario
    Object.keys(rankData).forEach(key => {
      if (key === 'icon' && rankData[key] instanceof File) {
        formData.append(key, rankData[key]);
      } else if (key === 'divisions') {
        formData.append(key, JSON.stringify(rankData[key]));
      } else {
        formData.append(key, rankData[key]);
      }
    });
    
    const response = await axios.post(`${ELOBOOST_URL}/ranks`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error creating EloBoost rank:', error);
    throw error;
  }
};

export const updateEloBoostRank = async (rankId, rankData) => {
  try {
    console.log('========== INICIO updateEloBoostRank ==========');
    
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    console.log('User JSON directamente de localStorage:', userJson);
    
    let user = null;
    try {
      user = userJson ? JSON.parse(userJson) : null;
      console.log('User parseado completo:', user);
    } catch (e) {
      console.error('Error al parsear user JSON:', e);
    }
    
    const userId = user?._id;
    console.log('UserID extraído:', userId);
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }

    // Intentar obtener el token directamente de localStorage
    const directToken = localStorage.getItem('token');
    console.log('Token directo de localStorage:', directToken);
    
    // Intentar obtener el token del objeto user
    const userToken = user?.token;
    console.log('Token del objeto user:', userToken);
    
    // Usar el que esté disponible
    const authToken = directToken || userToken;
    console.log('Token final que se usará:', authToken);
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    // Construir el config con el token
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    console.log('Config para la petición:', JSON.stringify(config));
    
    const formData = new FormData();
    
    // Añadir userId a los datos
    formData.append('userId', userId);
    
    // Agregar datos del rango al formulario
    Object.keys(rankData).forEach(key => {
      if (key === 'icon' && rankData[key] instanceof File) {
        formData.append(key, rankData[key]);
        console.log('Añadido archivo icon a formData');
      } else if (key === 'divisions') {
        formData.append(key, JSON.stringify(rankData[key]));
        console.log('Añadido divisions a formData:', JSON.stringify(rankData[key]));
      } else {
        formData.append(key, rankData[key]);
        console.log(`Añadido ${key}:${rankData[key]} a formData`);
      }
    });
    
    const url = `${ELOBOOST_URL}/ranks/${rankId}`;
    console.log('URL completa para la petición:', url);
    
    console.log('Enviando solicitud PUT...');
    const response = await axios.put(url, formData, config);
    console.log('Respuesta recibida:', response.status);
    console.log('Datos de respuesta:', response.data);
    
    console.log('========== FIN updateEloBoostRank ==========');
    return response.data;
  } catch (error) {
    console.error('========== ERROR updateEloBoostRank ==========');
    console.error('Error completo:', error);
    console.error('Mensaje de error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No se recibió respuesta:', error.request);
    }
    console.error('========== FIN ERROR updateEloBoostRank ==========');
    throw error;
  }
};

export const deleteEloBoostRank = async (rankId) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token usando la función helper
    const authToken = getAuthToken();
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        userId
      }
    };
    
    const response = await axios.delete(`${ELOBOOST_URL}/ranks/${rankId}`, config);
    return response.data;
  } catch (error) {
    console.error('Error deleting EloBoost rank:', error);
    throw error;
  }
};

export const updateEloBoostConfig = async (configData, token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    // Añadir el userId a los datos
    const dataWithUserId = {
      ...configData,
      userId
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await axios.put(`${ELOBOOST_URL}/config`, dataWithUserId, config);
    return response.data;
  } catch (error) {
    console.error('Error updating EloBoost config:', error);
    throw error;
  }
};

export const getAllEloBoostOrders = async (token, filters = {}) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        ...filters,
        userId
      }
    };
    
    const response = await axios.get(`${ELOBOOST_URL}/orders`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching all EloBoost orders:', error);
    throw error;
  }
};

export const updateEloBoostOrderStatus = async (orderId, statusData, token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    // Añadir el userId a los datos
    const dataWithUserId = {
      ...statusData,
      userId
    };
    
    console.log('Enviando actualización de estado:', {
      orderId,
      status: statusData.status,
      notes: statusData.notes || '(sin notas)'
    });
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await axios.put(
      `${ELOBOOST_URL}/orders/${orderId}/status`, 
      dataWithUserId,
      config
    );
    
    console.log('Respuesta del servidor tras actualizar estado:', response.data);
    
    // Verificar que la respuesta incluye la orden actualizada
    if (!response.data.order) {
      console.warn('La respuesta no incluye la orden actualizada');
    } else {
      // Verificar fechas
      console.log('Fechas en la orden actualizada:', {
        status: response.data.order.status,
        startDate: response.data.order.startDate,
        completionDate: response.data.order.completionDate
      });
    }
    
    return response.data;
  } catch (error) {
    console.error('Error updating EloBoost order status:', error);
    throw error;
  }
};

export const linkEloBoostOrderToPayment = async (linkData, token) => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token desde localStorage si no se proporcionó
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    // Añadir el userId a los datos
    const dataWithUserId = {
      ...linkData,
      userId
    };
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    };
    
    const response = await axios.post(
      `${ELOBOOST_URL}/orders/link-payment`, 
      dataWithUserId,
      config
    );
    return response.data;
  } catch (error) {
    console.error('Error linking payment to EloBoost order:', error);
    throw error;
  }
};

export const getEloBoostStats = async () => {
  try {
    // Obtener el usuario de localStorage para extraer el ID
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;
    const userId = user?._id;
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    // Obtener token usando la función helper
    const authToken = getAuthToken();
    
    if (!authToken) {
      throw new Error('Token de autenticación no encontrado');
    }
    
    const config = {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      params: {
        userId
      }
    };
    
    const response = await axios.get(`${ELOBOOST_URL}/stats`, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching EloBoost stats:', error);
    throw error;
  }
};

// No es necesario un método separado para subir recibos, ya que se gestiona en el proceso de checkout
// a través de createPurchase en purcharseService.js
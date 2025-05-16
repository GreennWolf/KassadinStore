// services/champsService.js

import axios from 'axios';

// Define la URL base de la API
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
const API_BASE_IMAGE = `${import.meta.env.VITE_API_URL}/images/`;

// Función auxiliar para transformar las URLs de las imágenes
const transformImageUrls = (skin) => {
    if (!skin) return null;
    return {
        ...skin,
        srcLocal: skin.srcLocal ? `${API_BASE_IMAGE}${skin.srcLocal.replace(/\\/g, '/')}` : null
    };
};

// Función auxiliar para transformar arrays de skins
const transformSkinsArray = (skins) => {
    if (!Array.isArray(skins)) return [];
    return skins.map(transformImageUrls);
};

//Actualizar page
export const obtenerActualizaciones = async () => {
    try {
        const response = await axios.post(`${API_BASE_URL}/scrape`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener actualizaciones:', error);
        throw error;
    }
};

// SERVICIOS PARA CAMPEONES

// Obtener todos los campeones
export const getAllChampions = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/champions`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener los campeones:', error);
        throw error;
    }
};

// Obtener un campeón por ID
export const getChampionById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/champion/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al obtener el campeón:', error);
        throw error;
    }
};

// Crear un nuevo campeón
export const createChampion = async (championData) => {
    try {
        const formData = new FormData();
        
        // Agregar datos básicos
        Object.keys(championData).forEach(key => {
            if (key !== 'championImage') {
                formData.append(key, championData[key]);
            }
        });

        // Agregar imagen si existe
        if (championData.championImage) {
            formData.append('championImage', championData.championImage);
        }

        const response = await axios.post(`${API_BASE_URL}/champions/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error al crear el campeón:', error);
        throw error;
    }
};

// Actualizar un campeón
export const updateChampion = async (id, championData) => {
    try {
        const formData = new FormData();
        
        // Agregar datos básicos
        Object.keys(championData).forEach(key => {
            if (key !== 'championImage') {
                formData.append(key, championData[key]);
            }
        });

        // Agregar imagen si existe
        if (championData.championImage) {
            formData.append('championImage', championData.championImage);
        }

        const response = await axios.put(`${API_BASE_URL}/champions/update/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error al actualizar el campeón:', error);
        throw error;
    }
};

// Eliminar un campeón
export const deleteChampion = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/champions/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar el campeón:', error);
        throw error;
    }
};

// SERVICIOS PARA SKINS

// Obtener todas las skins
export const getAllSkins = async (params) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            search = '', 
            subcategory = 'all', 
            showAll, 
            orderByNew = false,
            reward = false, // Nuevo parámetro
            ids = '' // Para buscar skins específicas por ID
        } = params;
        
        // Log de depuración para ver los parámetros de búsqueda
        console.log('Parámetros de búsqueda getAllSkins:', { page, limit, search, showAll, ids });
        
        const queryParams = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            search,
            subcategory,
            showAll,
            orderByNew: orderByNew.toString(),
            reward: reward.toString()
        });
        
        // Añadir IDs si se proporcionan
        if (ids) {
            queryParams.append('ids', ids);
        }

        const url = `${API_BASE_URL}/skins?${queryParams}`;
        console.log('URL de búsqueda:', url);
        
        const response = await axios.get(url);
        
        // Log de los resultados obtenidos
        console.log(`Resultados obtenidos: ${response.data?.data?.length || 0} skins`);
        
        // Transformar las URLs de las imágenes
        if (response.data && Array.isArray(response.data.data)) {
            return {
                ...response.data,
                data: transformSkinsArray(response.data.data)
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
        console.error('Error al obtener las skins:', error);
        console.error('Detalles del error:', error.response?.data || error.message);
        throw error;
    }
};

// Obtener una skin por ID
export const getSkinById = async (id) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/skinsId/${id}`);
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al obtener la skin:', error);
        throw error;
    }
};

// Obtener todas las skins de un campeón
export const getSkinsByChampionId = async (champion) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/champion/${champion}/skins`);
        return transformSkinsArray(response.data);
    } catch (error) {
        console.error('Error al obtener las skins del campeón:', error);
        throw error;
    }
};

export const createSkin = async (skinData) => {
    try {

        

        const formData = new FormData();

        // Agregar nombre de la skin
        formData.append('NombreSkin', skinData.NombreSkin);
        
        // Agregar precio RP (asegurarse de que sea el ID del precio)
        formData.append('priceRP', skinData.priceRP);
        
        // Agregar ID del campeón
        formData.append('champion', skinData.champion);
        
        formData.append('reward', skinData.reward);
        // Agregar la imagen
        if (skinData.src instanceof File) {
            formData.append('skinImage', skinData.src);
        }

        // Log para debugging
        // console.log('Sending form data:');
        for (let pair of formData.entries()) {
            // console.log(pair[0] + ': ' + (pair[1] instanceof File ? pair[1].name : pair[1]));
        }

        // console.log(skinData , 'Skin data service')

        const response = await axios.post(`${API_BASE_URL}/skins/create`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al crear la skin:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Status:', error.response.status);
        }
        throw error;
    }
};

// Actualizar una skin
export const updateSkin = async (id, skinData) => {
    try {

        const formData = new FormData();
        
        // Agregar nombre de la skin
        formData.append('NombreSkin', skinData.NombreSkin);
        
        // Agregar precio RP
        formData.append('priceRP', skinData.priceRP);
        
        // Agregar ID del campeón
        formData.append('champion', skinData.champion);
        formData.append('reward', skinData.reward);

        // Agregar la imagen si existe
        if (skinData.src instanceof File) {
            formData.append('skinImage', skinData.src); // Cambiado a 'skinImage'
        }

        // console.log('Updating skin with data:');
        for (let pair of formData.entries()) {
            // console.log(pair[0] + ': ' + pair[1]);
        }

        const response = await axios.put(`${API_BASE_URL}/skins/update/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        
        return transformImageUrls(response.data);
    } catch (error) {
        console.error('Error al actualizar la skin:', error);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        throw error;
    }
};
// Eliminar una skin
export const deleteSkin = async (id) => {
    try {
        const response = await axios.delete(`${API_BASE_URL}/skins/delete/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar la skin:', error);
        throw error;
    }
};

export const activeSkin = async (id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skins/active/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al eliminar la skin:', error);
        throw error;
    }
};

// Obtener skins nuevas
export const getAllNewSkins = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/getAllNewSkins`);
        return transformSkinsArray(response.data);
    } catch (error) {
        console.error('Error al obtener las skins nuevas:', error);
        throw error;
    }
};

export const getAllDestacadosSkins = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/skins/destacados`);
        return transformSkinsArray(response.data);
    } catch (error) {
        console.error('Error al obtener las skins destacadas:', error);
        throw error;
    }
};

// Toggle destacado de una skin
export const toggleDestacadoSkin = async (id) => {
    try {
        const response = await axios.put(`${API_BASE_URL}/skins/destacado/${id}`);
        return response.data;
    } catch (error) {
        console.error('Error al cambiar el estado destacado de la skin:', error);
        throw error;
    }
};

// Actualizar iconos de campeones específicos
export const updateMissingChampions = async (champions) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/update-missing-champions`, { champions });
    return response.data;
  } catch (error) {
    console.error('Error al actualizar iconos de campeones:', error);
    throw error;
  }
};

// Función auxiliar para verificar si una imagen existe
export const checkChampionImage = async (championName) => {
  try {
    // Intenta cargar la imagen para verificar si existe
    await axios.get(`${import.meta.env.VITE_API_URL}/champions/${championName}.png`, { responseType: 'blob' });
    return true;
  } catch (error) {
    console.warn(`No se pudo encontrar imagen para el campeón ${championName}`);
    return false;
  }
};

// Función para obtener una URL de imagen de campeón con respaldo
export const getChampionImageUrl = (championName, fallbackName = 'default') => {
  if (!championName) return `${import.meta.env.VITE_API_URL}/champions/${fallbackName}.png`;
  
  // Mapeo de nombres especiales para casos problemáticos
  const nameMapping = {
    'Wukong': 'MonkeyKing',
    'MonkeyKing': 'Wukong',
    'Nunu & Willump': 'Nunu',
    'Nunu': 'Nunu & Willump',
    'Aurelion Sol': 'AurelionSol',
    'Bel\'Veth': 'Belveth',
    'Cho\'Gath': 'Chogath',
    'Dr. Mundo': 'DrMundo',
    'Jarvan IV': 'JarvanIV',
    'Kai\'Sa': 'Kaisa',
    'Kha\'Zix': 'Khazix',
    'Kog\'Maw': 'KogMaw',
    'K\'Sante': 'KSante',
    'LeBlanc': 'Leblanc',
    'Lee Sin': 'LeeSin',
    'Master Yi': 'MasterYi',
    'Miss Fortune': 'MissFortune',
    'Rek\'Sai': 'RekSai',
    'Renata Glasc': 'Renata',
    'Tahm Kench': 'TahmKench',
    'Twisted Fate': 'TwistedFate',
    'Vel\'Koz': 'Velkoz',
    'Xin Zhao': 'XinZhao'
  };
  
  // Usar el nombre original primero
  let imageUrl = `${import.meta.env.VITE_API_URL}/champions/${championName}.png`;
  
  // Función para crear una imagen con respaldo
  const withFallback = (url, onError) => {
    const img = new Image();
    img.src = url;
    img.onerror = onError;
    return img;
  };
  
  // Probar primero con el nombre original
  const img = withFallback(imageUrl, () => {
    // Si falla, intentar con el nombre mapeado si existe
    const mappedName = nameMapping[championName];
    if (mappedName) {
      imageUrl = `${import.meta.env.VITE_API_URL}/champions/${mappedName}.png`;
      console.log(`Intentando nombre alternativo para ${championName}: ${mappedName}`);
    } else {
      // Si no hay mapeo, usar el respaldo predeterminado
      imageUrl = `${import.meta.env.VITE_API_URL}/champions/${fallbackName}.png`;
      console.warn(`Usando imagen de respaldo para ${championName}`);
    }
  });
  
  return imageUrl;
};

// Y asegúrate de incluirlas en el export default al final
export default {
    obtenerActualizaciones,
    // Operaciones de campeones
    getAllChampions,
    getChampionById,
    createChampion,
    updateChampion,
    deleteChampion,
    // Operaciones de skins
    getAllSkins,
    getSkinById,
    getSkinsByChampionId,
    createSkin,
    updateSkin,
    deleteSkin,
    getAllNewSkins,
    // Nuevas operaciones
    getAllDestacadosSkins,
    toggleDestacadoSkin,
    // Funciones para manejo de imágenes de campeones
    updateMissingChampions,
    checkChampionImage,
    getChampionImageUrl
};
// fragmentsService.js

import axios from "axios";

// Ajusta la URL base a la de tu servidor:
const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/fragments`;

// --------------------- PRESETS ---------------------

// Crear un nuevo FragmentsPreset
export const createFragmentsPreset = async (presetData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/presets`, presetData);
    return response.data;
  } catch (error) {
    console.error("Error al crear FragmentsPreset:", error?.response?.data || error);
    throw error;
  }
};

// Obtener un FragmentsPreset por su ID
export const getFragmentsPresetById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/presets/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener FragmentsPreset por ID:", error?.response?.data || error);
    throw error;
  }
};

// Obtener todos los FragmentsPreset
export const getAllFragmentsPresets = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/presets`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener todos los FragmentsPresets:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar un FragmentsPreset
export const updateFragmentsPreset = async (id, presetData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/presets/${id}`, presetData);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar FragmentsPreset:", error?.response?.data || error);
    throw error;
  }
};

// Eliminar (o desactivar) un FragmentsPreset
export const deleteFragmentsPreset = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/presets/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error al eliminar FragmentsPreset:", error?.response?.data || error);
    throw error;
  }
};

// --------------------- USER FRAGMENTS ---------------------

// Obtener los fragmentos de un usuario (FragmentsUser)
export const getUserFragments = async (userId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/user/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Error al obtener fragmentos del usuario:", error?.response?.data || error);
    throw error;
  }
};

// Actualizar la cantidad de fragmentos que el usuario posee
// (puede ser para sumar o restar fragmentos)
export const updateUserFragments = async (userId, fragmentId, quantityChange) => {
  try {
    // Se asume que el body requiere { fragmentQuantity: <number> } 
    const body = { fragmentQuantity: quantityChange };
    const response = await axios.put(`${API_BASE_URL}/user/${userId}/${fragmentId}`, body);
    return response.data;
  } catch (error) {
    console.error("Error al actualizar fragmentos del usuario:", error?.response?.data || error);
    throw error;
  }
};

// Canjear un fragmento (cuando el usuario tiene la cantidad requerida)
export const exchangeFragment = async (userId, presetId) => {
  try {
    // El servidor espera un POST a /exchange/:userId/:presetId
    const response = await axios.post(`${API_BASE_URL}/exchange/${userId}/${presetId}`);
    return response.data;
  } catch (error) {
    console.error("Error al canjear fragmento:", error?.response?.data || error);
    throw error;
  }
};

export default {
  createFragmentsPreset,
  getFragmentsPresetById,
  getAllFragmentsPresets,
  updateFragmentsPreset,
  deleteFragmentsPreset,
  getUserFragments,
  updateUserFragments,
  exchangeFragment
};

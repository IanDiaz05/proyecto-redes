// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Función centralizada para realizar peticiones al backend protegido.
 * Inyecta automáticamente el X-API-Key y maneja los errores HTTP.
 * 
 * @param {string} endpoint - La ruta del endpoint
 * @param {object} options - Opciones adicionales de fetch (method, body, etc.)
 */
export const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const result = await response.json();

    // Verificamos si el HTTP status es OK y si el backend devolvió "status": "ok"
    if (!response.ok || result.status !== "ok") {
      throw new Error(result.message || `Error del servidor: ${response.status}`);
    }

    // Retornamos directamente la data para que los componentes la consuman fácil
    return result.data;
    
  } catch (error) {
    console.error(`[API Error] - Endpoint: ${endpoint}`, error);
    throw error;
  }
};
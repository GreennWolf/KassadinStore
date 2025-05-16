// Este script es para probar directamente el endpoint de actualización de estado de una compra
// Ejecutar con: node test-update-status.js

const axios = require('axios');

// Configuración
const API_URL = 'http://localhost:3001/api'; // Ajusta esto según tu configuración
const PURCHASE_ID = '1234567890'; // Reemplaza con un ID de compra real
const TARGET_STATUS_ID = '5678901234'; // Reemplaza con un ID de estado que tenga configuración de "Completado" o similar

// Función para probar la actualización de estado
async function testUpdateStatus() {
  console.log('=== INICIANDO PRUEBA DE ACTUALIZACIÓN DE ESTADO ===');
  console.log(`Intentando actualizar la compra ${PURCHASE_ID} al estado ${TARGET_STATUS_ID}`);

  try {
    // Imprimir headers para debug
    console.log('Headers:', {
      'Content-Type': 'application/json'
    });

    // Imprimir cuerpo de la solicitud para debug
    const requestBody = { status: TARGET_STATUS_ID };
    console.log('Cuerpo de la solicitud:', JSON.stringify(requestBody));

    // Realizar la solicitud
    console.log(`Enviando solicitud PUT a ${API_URL}/purchases/edit/${PURCHASE_ID}`);
    const response = await axios.put(`${API_URL}/purchases/edit/${PURCHASE_ID}`, requestBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Procesar la respuesta
    console.log('Respuesta recibida:');
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    console.log('Datos:', JSON.stringify(response.data, null, 2));
    console.log('=== PRUEBA FINALIZADA CON ÉXITO ===');
  } catch (error) {
    console.error('=== ERROR EN LA PRUEBA ===');
    console.error('Mensaje de error:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No se recibió respuesta del servidor');
      console.error('Request:', error.request);
    } else {
      console.error('Error de configuración:', error.message);
    }
    
    console.error('Stack trace:', error.stack);
    console.error('=== FIN DEL ERROR ===');
  }
}

// Ejecutar la prueba
testUpdateStatus().catch(err => {
  console.error('Error no capturado:', err);
});
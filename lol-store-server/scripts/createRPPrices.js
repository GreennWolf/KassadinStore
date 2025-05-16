/**
 * Script para crear precios RP iniciales para el sistema de EloBoost
 * 
 * Ejecutar con:
 * node scripts/createRPPrices.js
 */

const mongoose = require('mongoose');
const config = require('../config/config');
const RPPrice = require('../database/Models/rpPrice');

// Conectar a la base de datos
mongoose.connect(config.db.uri)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => {
    console.error('Error al conectar a MongoDB:', err);
    process.exit(1);
  });

// Precios RP comunes para EloBoost
const rpPrices = [
  { valueRP: 500, priceSeguro: 5.00, priceBarato: 4.50, name: "500 RP", active: true },
  { valueRP: 1000, priceSeguro: 10.00, priceBarato: 9.00, name: "1000 RP", active: true },
  { valueRP: 1500, priceSeguro: 15.00, priceBarato: 13.50, name: "1500 RP", active: true },
  { valueRP: 2000, priceSeguro: 20.00, priceBarato: 18.00, name: "2000 RP", active: true },
  { valueRP: 2500, priceSeguro: 25.00, priceBarato: 22.50, name: "2500 RP", active: true },
  { valueRP: 3000, priceSeguro: 30.00, priceBarato: 27.00, name: "3000 RP", active: true },
  { valueRP: 3500, priceSeguro: 35.00, priceBarato: 31.50, name: "3500 RP", active: true },
  { valueRP: 4000, priceSeguro: 40.00, priceBarato: 36.00, name: "4000 RP", active: true },
  { valueRP: 4500, priceSeguro: 45.00, priceBarato: 40.50, name: "4500 RP", active: true },
  { valueRP: 5000, priceSeguro: 50.00, priceBarato: 45.00, name: "5000 RP", active: true },
];

// Función para crear los precios RP
async function createRPPrices() {
  try {
    console.log('Creando precios RP iniciales...');
    
    // Primero, verificar si ya existen estos precios
    for (const rpPrice of rpPrices) {
      const existingPrice = await RPPrice.findOne({ valueRP: rpPrice.valueRP });
      
      if (existingPrice) {
        console.log(`El precio de ${rpPrice.valueRP} RP ya existe. ID: ${existingPrice._id}`);
      } else {
        const newPrice = new RPPrice(rpPrice);
        await newPrice.save();
        console.log(`Precio de ${rpPrice.valueRP} RP creado. ID: ${newPrice._id}`);
      }
    }
    
    console.log('¡Proceso completado!');
    console.log('Ahora puedes usar estos precios RP para los rangos de EloBoost.');
    
    // Mostrar todos los precios disponibles
    const allPrices = await RPPrice.find().sort({ valueRP: 1 });
    console.log('\nLista de todos los precios RP disponibles:');
    allPrices.forEach(price => {
      console.log(`- ID: ${price._id}, Valor: ${price.valueRP} RP, Precio: $${price.priceSeguro}`);
    });
    
  } catch (error) {
    console.error('Error al crear precios RP:', error);
  } finally {
    mongoose.disconnect();
  }
}

// Ejecutar la función
createRPPrices();
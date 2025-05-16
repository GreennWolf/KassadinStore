// Script para asegurar que existe el rango por defecto
const mongoose = require('mongoose');
const Rank = require('../database/Models/ranksModel');
const config = require('../config/config');

mongoose.connect(config.dbConfig.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function ensureDefaultRank() {
    try {
        // Buscar o crear el rango por defecto
        let defaultRank = await Rank.findOne({ requiredXP: 0 });
        
        if (!defaultRank) {
            console.log('No se encontró el rango por defecto. Creándolo...');
            
            defaultRank = await Rank.create({
                name: 'Novato',
                requiredXP: 0,
                icon: '/RankIcons/default.png', // Ajusta la ruta según tu sistema
                color: '#808080' // Color gris
            });
            
            console.log('Rango por defecto creado:', defaultRank);
        } else {
            console.log('Rango por defecto encontrado:', defaultRank);
        }
        
        // Verificar todos los rangos
        const allRanks = await Rank.find().sort({ requiredXP: 1 });
        console.log('\nTodos los rangos en el sistema:');
        allRanks.forEach(rank => {
            console.log(`- ${rank.name}: ${rank.requiredXP} XP`);
        });
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

ensureDefaultRank();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const mongoose = require('mongoose');
const config = require('../config/config');

// Directorio donde se guardarán las imágenes
const championDir = path.join(__dirname, '../public/champions');

// Mapeo de nombres especiales (ID interno -> Nombre visual)
const championMappings = {
    'MonkeyKing': 'Wukong',
    'Nunu': 'Nunu & Willump',
};

// Conexión a la base de datos
const connectDB = async () => {
    try {
        await mongoose.connect(config.dbConfig.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error de conexión a MongoDB:', error);
        process.exit(1);
    }
};

// Asegurarse de que el directorio existe
const ensureDir = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (error) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
};

// Obtener la última versión de Data Dragon
const getLatestVersion = async () => {
    try {
        const response = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
        return response.data[0]; // La primera versión es la más reciente
    } catch (error) {
        console.error('Error al obtener la versión más reciente:', error);
        return '15.10.1'; // Versión por defecto
    }
};

// Obtener todos los campeones
const getChampions = async (version) => {
    try {
        const response = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`);
        return response.data.data;
    } catch (error) {
        console.error('Error al obtener campeones:', error);
        throw error;
    }
};

// Descargar la imagen de un campeón
const downloadChampionImage = async (imageUrl, imagePath) => {
    try {
        const response = await axios({
            url: imageUrl,
            method: 'GET',
            responseType: 'arraybuffer'
        });
        await fs.writeFile(imagePath, Buffer.from(response.data));
        return true;
    } catch (error) {
        console.error(`Error al descargar imagen desde ${imageUrl}:`, error);
        return false;
    }
};

// Función principal - versión solo descarga (sin base de datos)
const updateChampions = async () => {
    try {
        // Asegurarnos de que el directorio existe
        await ensureDir(championDir);
        
        // Obtener la última versión
        const version = await getLatestVersion();
        console.log(`Usando la versión ${version} de Data Dragon`);
        
        // Obtener todos los campeones
        const champions = await getChampions(version);
        console.log(`Encontrados ${Object.keys(champions).length} campeones en Data Dragon`);
        
        // Lista para seguimiento de los campeones actualizados
        const updatedChampions = [];
        
        // Recorrer y procesar cada campeón
        for (const champKey in champions) {
            const champion = champions[champKey];
            
            // Obtener el nombre visual (o usar el mapeo si existe)
            const visualName = championMappings[champion.id] || champion.name;
            
            // URLs de las imágenes
            const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`;
            
            // Crear dos archivos: uno con el nombre interno y otro con el nombre visual
            const internalFileName = `${champion.id}.png`;
            const visualFileName = `${visualName}.png`;
            
            const internalFilePath = path.join(championDir, internalFileName);
            const visualFilePath = path.join(championDir, visualFileName);
            
            console.log(`Procesando campeón: ${champion.id} (${visualName})`);
            
            // Descargar la imagen
            const success = await downloadChampionImage(imageUrl, internalFilePath);
            
            if (success) {
                // Si el campeón tiene un nombre visual diferente, crear una copia con ese nombre
                if (internalFileName !== visualFileName) {
                    await fs.copyFile(internalFilePath, visualFilePath);
                    console.log(`Creado archivo adicional: ${visualFileName}`);
                }
                
                // Agregar a la lista de campeones actualizados
                updatedChampions.push({
                    id: champion.id,
                    name: visualName,
                    internalPath: internalFilePath,
                    visualPath: visualFilePath
                });
                
                console.log(`Campeón ${champion.id} (${visualName}) descargado correctamente`);
            }
        }
        
        console.log('========== RESUMEN ==========');
        console.log(`Total de campeones procesados: ${updatedChampions.length}`);
        console.log('Campeones importantes verificados:');
        
        // Verificar específicamente los campeones que nos interesan
        const importantChampions = ['Ambessa', 'Aurora', 'MonkeyKing', 'Wukong'];
        for (const champName of importantChampions) {
            const found = updatedChampions.some(c => c.name === champName || c.id === champName);
            console.log(`- ${champName}: ${found ? 'DESCARGADO ✓' : 'NO ENCONTRADO ✗'}`);
            
            // Verificar si existe el archivo
            const filePath = path.join(championDir, `${champName}.png`);
            try {
                await fs.access(filePath);
                console.log(`  Archivo ${champName}.png: EXISTE ✓`);
            } catch (error) {
                console.log(`  Archivo ${champName}.png: NO EXISTE ✗`);
            }
        }
        
        console.log('Actualización de campeones completada con éxito');
        
    } catch (error) {
        console.error('Error al actualizar campeones:', error);
    }
};

// Ejecutar la actualización solo si este script se ejecuta directamente
if (require.main === module) {
    updateChampions();
}

// Exportar la función para poder usarla desde otros módulos
module.exports = { updateChampions };
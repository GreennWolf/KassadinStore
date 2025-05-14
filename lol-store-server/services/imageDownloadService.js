const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { imageFolderPath, chromaFolderPath } = require('../config/config');
const Skin = require('../database/Models/skinModel');
const Item = require('../database/Models/itemsModel'); // Importar el modelo de Item para chromas

// Función para reemplazar caracteres inválidos en nombres de archivos/carpetas
function sanitizeFileName(name) {
    if (!name) {
        console.warn('Nombre no válido encontrado:', name); // Log para debuggear nombres inválidos
        return 'unknown'; // Nombre predeterminado si el valor es undefined o null
    }
    return name.replace(/[\/\?%*:|"<>.]/g, '-').replace(/ /g, '-');
}

// Función para descargar skins
async function downloadChampionSkins(championName, skins) {
    const championDir = path.join(imageFolderPath, sanitizeFileName(championName.replace(/ /g, '_')));

    if (!fs.existsSync(championDir)) {
        fs.mkdirSync(championDir, { recursive: true });
    }

    for (const skin of skins) {
        const skinName = sanitizeFileName(skin.NombreSkin);
        const localImagePath = path.join(championDir, `${skinName}.jpg`);

        // Verifica si la skin ya está en la base de datos
        const skinInDb = await Skin.findOne({NombreSkin: skin.NombreSkin }); // Usar _id para buscar la skin

        if (fs.existsSync(localImagePath)) {
            if (skinInDb && skinInDb.srcLocal === getRelativeImagePath(localImagePath, imageFolderPath)) {
                continue; // Imagen ya existe y srcLocal es correcto
            } else {
                console.log(`El srcLocal para ${skinName} es incorrecto. Actualizando...`);
            }
        }

        try {
            const response = await axios({
                url: skin.src,
                method: 'GET',
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(localImagePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const relativeImagePath = getRelativeImagePath(localImagePath, imageFolderPath);

            if (skinInDb) {
                await Skin.findByIdAndUpdate(skinInDb._id, { srcLocal: relativeImagePath }, { new: false });
            } else {
                console.log(`La skin ${skinName} no existe en la base de datos.`);
            }
        } catch (error) {
            console.error(`Error descargando la skin ${skinName}:`, error.message);
        }
    }
}

// Función para obtener la ruta relativa eliminando el prefijo 'public/images'
function getRelativeImagePath(fullImagePath, baseFolder) {
    return path.relative(baseFolder, fullImagePath).replace(/\\/g, '/');
}

// Función para descargar chromas
async function downloadChampionChromas(championName, chromas) {
    const chromaPackDir = path.join(chromaFolderPath, sanitizeFileName(championName.replace(/ /g, '_')));

    if (!fs.existsSync(chromaPackDir)) {
        fs.mkdirSync(chromaPackDir, { recursive: true });
    }

    // Función para descargar un chroma
    const downloadChroma = async (chroma) => {
        const chromaPackName = sanitizeFileName(chroma.NombrePack || 'default'); // Usa 'default' si es undefined
        const chromaDir = path.join(chromaPackDir, chromaPackName);

        if (!fs.existsSync(chromaDir)) {
            fs.mkdirSync(chromaDir, { recursive: true });
        }

        const chromaName = sanitizeFileName(chroma.NombreChroma || 'unknown'); // Usa 'unknown' si es undefined
        const localImagePath = path.join(chromaDir, `${chromaName}.jpg`);

        // Buscar en la base de datos
        const chromaInDb = await Item.findOne({ _id: chroma.id, type: 'chromas' });

        if (!chromaInDb) {
            console.log(`No se encontró chroma ${chromaName} en la base de datos. Omitiendo descarga.`);
            return; // Si no hay coincidencias, omitir
        }

        // Comprobar si la skin se relaciona con el chroma usando skin._id
        const skinMatch = await Skin.findOne({ _id: chromaInDb.skin });

        if (!skinMatch) {
            console.log(`No se encontró coincidencia para ${chromaName} en skins. Omitiendo descarga.`);
            return; // Si no hay coincidencias, omitir
        }

        // Verifica si la imagen ya existe
        if (fs.existsSync(localImagePath)) {
            if (chromaInDb && chromaInDb.srcLocal === getRelativeImagePath(localImagePath, chromaFolderPath)) {
                return; // Imagen ya existe y srcLocal es correcto
            } else {
                console.log(`El srcLocal para ${skinMatch.NombreSkin} es incorrecto. Actualizando...`);
            }
        }

        try {
            const response = await axios({
                url: chroma.src,
                method: 'GET',
                responseType: 'stream',
            });

            const writer = fs.createWriteStream(localImagePath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const relativeImagePath = getRelativeImagePath(localImagePath, chromaFolderPath);

            // Actualizar srcLocal en la base de datos
            if (chromaInDb) {
                await Item.findByIdAndUpdate(chromaInDb._id, { srcLocal: relativeImagePath }, { new: true });
            } else {
                console.log(`El chroma ${chromaName} no existe en la base de datos.`);
            }
        } catch (error) {
            console.error(`Error descargando chroma ${chroma.NombreChroma} para ${championName}:`, error.message);
            console.error(chroma);
        }
    };

    // Ejecutar descargas en paralelo usando Promise.all
    await Promise.all(chromas.map(downloadChroma));
}

module.exports = {
    downloadChampionSkins,
    downloadChampionChromas,
};

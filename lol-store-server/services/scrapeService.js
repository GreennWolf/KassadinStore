const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const fs = require('fs');
const { promises: fsPromises } = require('fs'); // Importar promesas de fs
const { championsUrl, baseUrlForSkins ,baseUrlWiki} = require('../config/config');

// services/scrapeService.js

async function scrapeChampionNames() {
    const { data } = await axios.get(championsUrl);
    const $ = cheerio.load(data);
    const champions = [];

    $('table.article-table tbody tr').each((i, elem) => {
        const championFullTextElement = $(elem).find('td:nth-child(1) span span a').first();
        const championFullText = championFullTextElement.length > 0
            ? championFullTextElement.html().split('<br>')[0].trim().replace(/&amp;/g, '&')
            : null;

        if (championFullText) {
            champions.push(championFullText);
        }
    });

    console.log('campeones correctos')
    
    return champions;
}

async function scrapeSkinsForChampion(championName) {
    const championForSkinSearch = championName === "Nunu & Willump" ? "Nunu" : championName.replace(/ /g, '_');
    const url = `${baseUrlForSkins}${championForSkinSearch}/Cosmetics`;
 
    try {
        const { data } = await axios.get(encodeURI(url));
        const $ = cheerio.load(data);
        const skins = [];
 
        $('div[style*="display:inline-block"][style*="width:342px"]').each((i, elem) => {
            const $elem = $(elem);
            const imageUrl = $elem.find('img.mw-file-element').attr('src');
            
            // Obtener el nombre sin el "View in 3D"
            const skinNameDiv = $elem.find('div[style="float:left"]');
            const skinName = skinNameDiv.clone()
                .find('span.plainlinks')
                .remove()
                .end()
                .text()
                .trim();
            
            // Obtener el precio (el texto después del icono RP)
            const price = $elem.find('.inline-image.label-after span[style="white-space:normal;"]').text().trim();
 
            if (skinName && price && imageUrl && !skinName.toLowerCase().includes('original')) {
                skins.push({
                    NombreSkin: skinName,
                    Precio: price,
                    src: imageUrl.startsWith('http') ? imageUrl : `https://wiki.leagueoflegends.com/${imageUrl}`
                });
            }
        });
 
        return skins;
    } catch (error) {
        console.error(`Error scraping skins for champion ${championName}:`, error);
        return [];
    }
 }

 async function scrapeChromasForChampion(championName) {
    const championForChromaSearch = championName === "Nunu & Willump" ? "Nunu" : championName.replace(/ /g, '_');
    const url = `${baseUrlForSkins}${championForChromaSearch}/LoL/Cosmetics`;

    try {
        const { data } = await axios.get(encodeURI(url));
        const $ = cheerio.load(data);
        const chromas = [];

        $('#chromaexhibition').each((i, exhibition) => {
            const packName = $(exhibition).find('b').first().text()
                .replace(' Chromas', '')
                .replace(' Chroma', '');

            // Detectar qué tipo de galería está usando
            const galleryType = $(exhibition).find('.chroma-gallery-large').length > 0 ? 
                '.chroma-gallery-large' : '.chroma-gallery';

            $(exhibition).find(`${galleryType} > div:not(.base)`).each((j, chromaDiv) => {
                const $chromaDiv = $(chromaDiv);
                const imageUrl = $chromaDiv.find('.chroma img').attr('src');
                const chromaName = $chromaDiv.find('.chroma-caption').text().trim();

                if (chromaName && imageUrl && !chromaName.includes('Base')) {
                    chromas.push({
                        NombrePack: packName,
                        NombreChroma: chromaName,
                        Precio: 290,
                        src: imageUrl.startsWith('http') ? imageUrl : `https://wiki.leagueoflegends.com${imageUrl}`
                    });
                }
            });
        });

        return chromas;
    } catch (error) {
        console.error(`Error scraping chromas for champion ${championName}:`, error);
        return [];
    }
}

// Reemplazar caracteres inválidos en nombres de archivos o directorios
function sanitizeFileName(name) {
    return name.replace(/[\/\?%*:|"<>]/g, '-').replace(/ /g, '-');
}

async function scrapeNewSkins() {
    try {
        // Hacemos la solicitud a la página
        const { data } = await axios.get(baseUrlWiki);
        const $ = cheerio.load(data);

        const newSkins = [];

        // Seleccionamos el contenedor que tiene las skins nuevas
        $('#newskins .skin_portrait').each((i, elem) => {
            try {
                // Obtenemos el nombre del campeón y la skin desde los atributos data
                const champion = $(elem).attr('data-champion');
                const skin = $(elem).attr('data-skin');
                
                // Intentamos obtener el nombre completo de la skin desde el título
                const title = $(elem).attr('title');
                let fullSkinName = title;
                
                // Si el título contiene '|', extraer el nombre de la skin
                if (title && title.includes('|')) {
                    fullSkinName = title.split('|')[0].trim();
                }
                
                // Usar directamente el texto mostrado en el elemento si está disponible
                const skinText = $(elem).text().trim();
                if (skinText && skinText.length > 0) {
                    fullSkinName = skinText;
                }
                
                console.log(`Nueva skin detectada: '${fullSkinName}' para campeón: '${champion}'`);
                
                if (champion && (skin || fullSkinName)) {
                    // Agregamos la skin a la lista de skins nuevas
                    newSkins.push({
                        champion,
                        skin,
                        fullSkinName
                    });
                }
            } catch (elemError) {
                console.error('Error procesando elemento de skin nueva:', elemError);
            }
        });

        console.log(`Total de skins nuevas detectadas: ${newSkins.length}`);
        // Devolvemos la lista de skins nuevas
        return newSkins;
    } catch (error) {
        console.error('Error al obtener las skins nuevas:', error);
        return [];
    }
}

// Función para hacer scraping de los iconos de campeones
// Mapeo de nombres de campeones para manejar casos especiales
const championNameMapping = {
    'MonkeyKing': 'Wukong',      // MonkeyKing es el nombre interno para Wukong
    'Fiddlesticks': 'Fiddlesticks', // Algunas versiones pueden tener diferentes capitalizaciones
    'Nunu & Willump': 'Nunu',    // Nunu & Willump a menudo se abrevia como Nunu
    // Añadir otros mapeos específicos según sea necesario
};

// Función para obtener el nombre amigable de un campeón
function getFriendlyChampionName(internalName, displayName) {
    // Si hay un mapeo específico, usarlo
    if (championNameMapping[internalName]) {
        return championNameMapping[internalName];
    }
    // Si no hay mapeo, usar el nombre de visualización
    return displayName;
}

async function scrapeChampionIcons() {
    try {
        console.log('Iniciando scraping de iconos de campeones');
        const championsData = [];
        
        // URL oficial con datos de campeones - usar la versión más reciente
        const latestVersionUrl = 'https://ddragon.leagueoflegends.com/api/versions.json';
        console.log('Obteniendo la versión más reciente de Data Dragon');
        
        let version = '14.10.1'; // Versión por defecto en caso de fallo
        try {
            const versionResponse = await axios.get(latestVersionUrl);
            version = versionResponse.data[0]; // Primera versión es la más reciente
            console.log('Versión más reciente de Data Dragon:', version);
        } catch (error) {
            console.error('Error al obtener la versión más reciente, usando versión por defecto:', version);
        }
        
        const url = `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion.json`;
        
        console.log('Obteniendo datos de campeones desde:', url);
        const { data } = await axios.get(url);
        
        // Directorio donde se guardarán las imágenes
        const uploadsDir = path.join(__dirname, '../public/champions');
        try {
            await fsPromises.access(uploadsDir);
        } catch {
            await fsPromises.mkdir(uploadsDir, { recursive: true });
        }
        
        // Procesar cada campeón en los datos
        const champList = data.data;
        for (const champKey in champList) {
            const champion = champList[champKey];
            
            // Construir URL de la imagen - usar versión dinámica
            const imageUrl = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`;
            
            // Obtener el nombre amigable del campeón
            const friendlyName = getFriendlyChampionName(champion.id, champion.name);
            
            // Crear dos nombres de archivo: uno con el ID interno para compatibilidad y otro con el nombre amigable
            const originalFileName = champion.image.full;
            const friendlyFileName = `${friendlyName}.png`;
            
            const originalFilePath = path.join(uploadsDir, originalFileName);
            const friendlyFilePath = path.join(uploadsDir, friendlyFileName);
            const relativeFilePath = `/champions/${friendlyFileName}`; // Usar el nombre amigable como ruta principal
            
            // Almacenar ambos nombres en los datos para poder crear ambos archivos
            championsData.push({
                name: friendlyName,         // Nombre amigable para mostrar
                id: champion.id,            // ID interno de Riot
                key: champion.key,          // Clave numérica
                iconUrl: imageUrl,          // URL de la imagen
                localPath: relativeFilePath, // Ruta local principal (con nombre amigable)
                originalFileName,           // Nombre de archivo original
                friendlyFileName,           // Nombre de archivo amigable
                originalFilePath,           // Ruta completa al archivo original
                friendlyFilePath            // Ruta completa al archivo amigable
            });
        }
        
        console.log(`Encontrados ${championsData.length} campeones`);
        return championsData;
    } catch (error) {
        console.error('Error en scrapeChampionIcons:', error);
        throw error;
    }
}

// Función para descargar los iconos de campeones
async function downloadChampionIcons(championsData) {
    try {
        console.log('Iniciando descarga de iconos de campeones');
        
        // Directorio donde se guardarán las imágenes
        const uploadsDir = path.join(__dirname, '../public/champions');
        try {
            await fsPromises.access(uploadsDir);
        } catch {
            await fsPromises.mkdir(uploadsDir, { recursive: true });
        }
        
        const downloadPromises = championsData.map(async (champion) => {
            try {
                // Comprobar si necesitamos descargar esta imagen
                let needDownload = true;
                try {
                    await fsPromises.access(champion.friendlyFilePath);
                    await fsPromises.access(champion.originalFilePath);
                    needDownload = false;
                } catch {
                    needDownload = true;
                }
                
                // Si ambos archivos ya existen, no descargar nuevamente
                if (!needDownload) {
                    console.log(`Omitiendo descarga de ${champion.name}, archivos ya existen`);
                    return champion;
                }
                
                console.log(`Descargando imagen para ${champion.name} (${champion.id})`);
                
                // Descargar la imagen
                const response = await axios({
                    url: champion.iconUrl,
                    method: 'GET',
                    responseType: 'arraybuffer' // Usamos arraybuffer para poder escribir el mismo contenido a múltiples archivos
                });
                
                // Guardar la imagen con ambos nombres
                // 1. Con el nombre amigable (principal)
                await fsPromises.writeFile(champion.friendlyFilePath, Buffer.from(response.data));
                
                // 2. Con el nombre original (para compatibilidad)
                // Solo si los nombres son diferentes
                if (champion.originalFileName !== champion.friendlyFileName) {
                    await fsPromises.writeFile(champion.originalFilePath, Buffer.from(response.data));
                    console.log(`Guardado ${champion.name} como ${champion.friendlyFileName} y ${champion.originalFileName}`);
                } else {
                    console.log(`Guardado ${champion.name} como ${champion.friendlyFileName}`);
                }
                
                return champion;
            } catch (error) {
                console.error(`Error descargando icono para ${champion.name}:`, error);
                return champion; // Retornar el campeón incluso si hay error para no romper la promesa
            }
        });
        
        await Promise.all(downloadPromises);
        console.log('Descarga de iconos completada');
        return championsData;
    } catch (error) {
        console.error('Error en downloadChampionIcons:', error);
        throw error;
    }
}

module.exports = {
    scrapeChampionNames,
    scrapeSkinsForChampion,
    scrapeChromasForChampion,
    scrapeNewSkins,
    sanitizeFileName,
    scrapeChampionIcons,
    downloadChampionIcons
};

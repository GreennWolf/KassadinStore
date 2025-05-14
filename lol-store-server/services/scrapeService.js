const axios = require('axios');
const cheerio = require('cheerio');
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
            // Obtenemos el nombre del campeón y la skin desde los atributos data
            const champion = $(elem).attr('data-champion');
            const skin = $(elem).attr('data-skin');

            // console.log('Nueva skin para:' , champion)

            if (champion && skin) {
                // Agregamos la skin a la lista de skins nuevas
                newSkins.push({
                    champion,
                    skin
                });
            }
        });

        // Devolvemos la lista de skins nuevas
        return newSkins;
    } catch (error) {
        console.error('Error al obtener las skins nuevas:', error);
        return [];
    }
}

module.exports = {
    scrapeChampionNames,
    scrapeSkinsForChampion,
    scrapeChromasForChampion,
    scrapeNewSkins,
    sanitizeFileName
};

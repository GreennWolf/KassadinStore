const { 
    scrapeChampionNames, 
    scrapeSkinsForChampion, 
    scrapeChromasForChampion, 
    scrapeNewSkins 
} = require('../services/scrapeService');
const { 
    downloadChampionSkins, 
    downloadChampionChromas 
} = require('../services/imageDownloadService');
const Item = require('../database/Models/itemsModel');
const Champion = require('../database/Models/championModel');
const RPPrice = require('../database/Models/rpPrice');
const Skin = require('../database/Models/skinModel');
const { CustomError } = require('../middlewares/errorHandler');

async function handleSkinCreation(skinData, champion) {
    const rpValue = parseInt(skinData.Precio, 10);
    if (isNaN(rpValue)) return null;

    let rpPrice = await RPPrice.findOneAndUpdate(
        { valueRP: rpValue },
        { valueRP: rpValue },
        { upsert: true, new: true }
    );

    const existingSkin = await Skin.findOne({ 
        NombreSkin: skinData.NombreSkin, 
        champion: champion._id 
    });

    if (!existingSkin) {
        return await Skin.create({
            NombreSkin: skinData.NombreSkin,
            src: skinData.src,
            srcLocal: skinData.srcLocal || '',
            champion: champion._id,
            priceRP: rpPrice._id,
            new: false
        });
    }
    return existingSkin;
}

async function handleChromaCreation(chromaData, champion) {
    const skinBase = await Skin.findOne({ 
        NombreSkin: chromaData.NombrePack, 
        champion: champion._id 
    });

    if (!skinBase) {
        console.warn(`Skin base no encontrada para el chroma: ${chromaData.NombrePack}`);
        return null;
    }

    let rpPrice = await RPPrice.findOneAndUpdate(
        { valueRP: chromaData.Precio },
        { valueRP: chromaData.Precio },
        { upsert: true, new: true }
    );

    const existingChroma = await Item.findOne({ 
        name: chromaData.NombreChroma, 
        type: 'chromas', 
        skin: skinBase._id 
    });

    if (!existingChroma) {
        const chroma = await Item.create({
            name: chromaData.NombreChroma,
            type: 'chromas',
            priceRP: rpPrice._id,
            srcWeb: chromaData.src,
            srcLocal: chromaData.srcLocal || '',
            skin: skinBase._id.toString()
        });
        chromaData.id = chroma._id.toString();
        return chroma;
    }

    chromaData.id = existingChroma._id.toString();
    return existingChroma;
}

async function scrapeAndUpdate(req, res, next) {
    try {
        const champions = await scrapeChampionNames();
        if (!champions?.length) {
            throw new CustomError('No se pudieron obtener los campeones', 500);
        }

        for (const championName of champions) {
            const champion = await Champion.findOneAndUpdate(
                { name: championName },
                { name: championName },
                { upsert: true, new: true }
            );

            const skins = await scrapeSkinsForChampion(championName);
            for (const skinData of skins) {
                await handleSkinCreation(skinData, champion);
            }
            await downloadChampionSkins(championName, skins);

            const chromas = await scrapeChromasForChampion(championName);
            for (const chromaData of chromas) {
                await handleChromaCreation(chromaData, champion);
            }
            await downloadChampionChromas(championName, chromas);
        }

        await Skin.updateMany({}, { new: false });
        
        const newSkins = await scrapeNewSkins();
        const updatePromises = newSkins.map(newSkin => 
            Skin.findOneAndUpdate(
                { NombreSkin: `${newSkin.skin} ${newSkin.champion}` },
                { new: true },
                { new: true }
            )
        );
        await Promise.all(updatePromises);

        res.json({ message: 'Scraping completado exitosamente' });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    scrapeAndUpdate
};
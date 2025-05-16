const express = require('express');
const { 
    scrapeAndUpdate, 
    scrapeChampionIconsAndUpdate,
    updateMissingChampionIcons,
    getNewSkins,
    toggleSkinNewStatus
} = require('../controllers/scrapeController');
const router = express.Router();

// Rutas de scraping principales
router.post('/scrape', scrapeAndUpdate);
router.post('/scrape-champion-icons', scrapeChampionIconsAndUpdate);
router.post('/update-missing-champions', updateMissingChampionIcons);

// Rutas para gestionar skins nuevas
router.get('/new-skins', getNewSkins);
router.patch('/skins/:skinId/toggle-new', toggleSkinNewStatus);

module.exports = router;

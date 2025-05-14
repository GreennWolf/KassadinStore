const express = require('express');
const { scrapeAndUpdate } = require('../controllers/scrapeController');
const router = express.Router();

router.post('/scrape', scrapeAndUpdate);

module.exports = router;

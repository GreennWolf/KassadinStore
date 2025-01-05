const Currency = require('../database/Models/currencyModel');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const { CustomError } = require('../middlewares/errorHandler');

const uploadDir = 'public/currencys';

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const currencyName = req.body.name.toLowerCase().replace(/\s+/g, '-');
        cb(null, `${currencyName}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new CustomError('Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)', 400));
    }
});

async function createCurrency(req, res, next) {
    try {
        const { name, code, symbol ,active} = req.body;

        if (!name || !code || !symbol) {
            throw new CustomError('Todos los campos son requeridos', 400);
        }

        const src = req.file ? req.file.filename : null;
        const newCurrency = new Currency({ name, code, symbol, src ,active });
        await newCurrency.save();
        
        res.status(201).json(newCurrency);
    } catch (error) {
        if (error.code === 11000) {
            next(new CustomError('La divisa ya existe', 409));
            return;
        }
        next(error);
    }
}

async function updateCurrency(req, res, next) {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        if (req.file) {
            updates.src = req.file.filename;
        }

        const updatedCurrency = await Currency.findByIdAndUpdate(
            id, 
            updates, 
            { new: true, runValidators: true }
        );
        
        if (!updatedCurrency) {
            throw new CustomError('Divisa no encontrada', 404);
        }

        res.status(200).json(updatedCurrency);
    } catch (error) {
        if (error.code === 11000) {
            next(new CustomError('La divisa ya existe', 409));
            return;
        }
        next(error);
    }
}

async function getCurrencyById(req, res, next) {
    try {
        const { id } = req.params;
        const currency = await Currency.findById(id);
        
        if (!currency) {
            throw new CustomError('Divisa no encontrada', 404);
        }
        
        res.json(currency);
    } catch (error) {
        next(error);
    }
}

async function getAllCurrencies(req, res, next) {
    try {
        const currencies = await Currency.find();
        res.status(200).json(currencies);
    } catch (error) {
        next(error);
    }
}

async function deleteCurrency(req, res, next) {
    try {
        const { id } = req.params;
        const currencyToDelete = await Currency.findById(id);
        
        if (!currencyToDelete) {
            throw new CustomError('Divisa no encontrada', 404);
        }

        const desactivatedCurrency = await Currency.findByIdAndUpdate(
            id,
            { active: false },
            { new: true, runValidators: true }
        );

        res.status(204).send('Divisa desactivada correctamente');
    } catch (error) {
        next(error);
    }
}

async function activeCurrency(req, res, next) {
    try {
        const { id } = req.params;
        const currencyToActive = await Currency.findById(id);
        
        if (!currencyToActive) {
            throw new CustomError('Divisa no encontrada', 404);
        }

        const activedCurrency = await Currency.findByIdAndUpdate(
            id,
            { active: true },
            { new: true, runValidators: true }
        );

        res.status(204).send('Divisa activada correctamente');
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createCurrency,
    getCurrencyById,
    getAllCurrencies,
    updateCurrency,
    deleteCurrency,
    activeCurrency,
    upload
};
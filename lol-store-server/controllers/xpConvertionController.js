const XpConvertion = require('../database/Models/xpConvertion');
const Currency = require('../database/Models/currencyModel');
const { CustomError } = require('../middlewares/errorHandler');

async function getAllXpConvertions(req, res, next) {
    try {
        const xpConvertions = await XpConvertion.find().populate('currency');
        res.status(200).json(xpConvertions);
    } catch (error) {
        next(error);
    }
}

async function createXpConvertion(req, res, next) {
    try {
        const { xpAmount, currency, currencyAmount } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!xpAmount || !currency || !currencyAmount) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Todos los campos son requeridos'
            );
        }

        // Verificar que la moneda existe
        const currencyExists = await Currency.findById(currency);
        if (!currencyExists) {
            throw new CustomError(
                'Moneda no encontrada',
                404,
                'La moneda especificada no existe'
            );
        }

        // Verificar si ya existe una conversión para esta moneda
        const existingConvertion = await XpConvertion.findOne({ currency });
        if (existingConvertion) {
            throw new CustomError(
                'Conversión duplicada',
                400,
                'Ya existe una conversión para esta moneda'
            );
        }

        // Crear nueva conversión
        const newXpConvertion = new XpConvertion({
            xpAmount,
            currency,
            currencyAmount
        });

        await newXpConvertion.save();
        
        // Poblar la referencia a la moneda antes de enviar la respuesta
        await newXpConvertion.populate('currency');

        res.status(201).json(newXpConvertion);
    } catch (error) {
        next(error);
    }
}

async function updateXpConvertion(req, res, next) {
    try {
        const { id } = req.params;
        const { xpAmount, currencyAmount } = req.body;

        // Validar que al menos un campo para actualizar esté presente
        if (!xpAmount && !currencyAmount) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Se requiere al menos un campo para actualizar'
            );
        }

        // Buscar y actualizar la conversión
        const updatedXpConvertion = await XpConvertion.findByIdAndUpdate(
            id,
            { xpAmount, currencyAmount },
            { new: true, runValidators: true }
        ).populate('currency');

        if (!updatedXpConvertion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json(updatedXpConvertion);
    } catch (error) {
        next(error);
    }
}

async function deleteXpConvertion(req, res, next) {
    try {
        const { id } = req.params;
        
        const deletedXpConvertion = await XpConvertion.findByIdAndDelete(id);
        
        if (!deletedXpConvertion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json({
            message: 'Conversión eliminada exitosamente'
        });
    } catch (error) {
        next(error);
    }
}

// Función auxiliar para calcular XP basado en el monto de una compra
async function calculateXp(currencyId, amount) {
    const convertion = await XpConvertion.findOne({ currency: currencyId });
    if (!convertion) {
        throw new CustomError(
            'Conversión no encontrada',
            404,
            'No existe una conversión para esta moneda'
        );
    }

    // Calcula el XP proporcionalmente
    // Si 10 USD = 20 XP, entonces 15 USD = 30 XP
    return (amount * convertion.xpAmount) / convertion.currencyAmount;
}

module.exports = {
    getAllXpConvertions,
    createXpConvertion,
    updateXpConvertion,
    deleteXpConvertion,
    calculateXp
};
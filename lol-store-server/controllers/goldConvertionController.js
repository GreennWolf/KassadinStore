const GoldConvertion = require('../database/Models/goldConvertionModel');
const RPPrice = require('../database/Models/rpPrice'); // Asumiendo que existe este modelo
const { CustomError } = require('../middlewares/errorHandler');

async function getAllGoldConvertions(req, res, next) {
    try {
        const goldConvertions = await GoldConvertion.find().populate('rpPrice');
        res.status(200).json(goldConvertions);
    } catch (error) {
        next(error);
    }
}

async function createGoldConvertion(req, res, next) {
    try {
        const { gold, rpPrice } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!gold || !rpPrice) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Todos los campos son requeridos'
            );
        }

        // Verificar que el precio RP existe
        const rpPriceExists = await RPPrice.findById(rpPrice);
        if (!rpPriceExists) {
            throw new CustomError(
                'Precio RP no encontrado',
                404,
                'El precio RP especificado no existe'
            );
        }

        // Verificar si ya existe una conversión para este precio RP
        const existingConvertion = await GoldConvertion.findOne({ rpPrice });
        if (existingConvertion) {
            throw new CustomError(
                'Conversión duplicada',
                400,
                'Ya existe una conversión para este precio RP'
            );
        }

        // Crear nueva conversión
        const newGoldConvertion = new GoldConvertion({
            gold,
            rpPrice
        });

        await newGoldConvertion.save();
        
        // Poblar la referencia al precio RP antes de enviar la respuesta
        await newGoldConvertion.populate('rpPrice');

        res.status(201).json(newGoldConvertion);
    } catch (error) {
        next(error);
    }
}

async function updateGoldConvertion(req, res, next) {
    try {
        const { id } = req.params;
        const { gold } = req.body;

        // Validar que el campo para actualizar esté presente
        if (!gold) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Se requiere el campo gold para actualizar'
            );
        }

        // Buscar y actualizar la conversión
        const updatedGoldConvertion = await GoldConvertion.findByIdAndUpdate(
            id,
            { gold },
            { new: true, runValidators: true }
        ).populate('rpPrice');

        if (!updatedGoldConvertion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json(updatedGoldConvertion);
    } catch (error) {
        next(error);
    }
}

async function deleteGoldConvertion(req, res, next) {
    try {
        const { id } = req.params;
        
        const deletedGoldConvertion = await GoldConvertion.findByIdAndDelete(id);
        
        if (!deletedGoldConvertion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json({
            message: 'Conversión eliminada exitosamente'
        });
    } catch (error) {
        next(error);
    }
}

// Función auxiliar para calcular oro basado en el precio RP
async function calculateGold(rpPriceId, amount) {
    const convertion = await GoldConvertion.findOne({ rpPrice: rpPriceId });
    if (!convertion) {
        throw new CustomError(
            'Conversión no encontrada',
            404,
            'No existe una conversión para este precio RP'
        );
    }

    // Calcula el oro proporcionalmente
    return (amount * convertion.gold);
}

module.exports = {
    getAllGoldConvertions,
    createGoldConvertion,
    updateGoldConvertion,
    deleteGoldConvertion,
    calculateGold
};
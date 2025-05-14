const XpConversion = require('../database/Models/xpConvertion');
const RPPrice = require('../database/Models/rpPrice');
const { CustomError } = require('../middlewares/errorHandler');

async function getAllXpConversions(req, res, next) {
    try {
        const xpConversions = await XpConversion.find().populate('rpPrice');
        res.status(200).json(xpConversions);
    } catch (error) {
        next(error);
    }
}

async function createXpConversion(req, res, next) {
    try {
        const { rpPrice, xpSeguro, xpBarato } = req.body;

        // Validar que todos los campos requeridos estén presentes
        if (!rpPrice || !xpSeguro || !xpBarato) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Todos los campos son requeridos'
            );
        }

        // Verificar que el RPPrice existe
        const rpPriceExists = await RPPrice.findById(rpPrice);
        if (!rpPriceExists) {
            throw new CustomError(
                'RP Price no encontrado',
                404,
                'El RP Price especificado no existe'
            );
        }

        // Verificar si ya existe una conversión para este RPPrice
        const existingConversion = await XpConversion.findOne({ rpPrice });
        if (existingConversion) {
            throw new CustomError(
                'Conversión duplicada',
                400,
                'Ya existe una conversión para este RP Price'
            );
        }

        // Crear nueva conversión
        const newXpConversion = new XpConversion({
            rpPrice,
            xpSeguro,
            xpBarato,
            active: true
        });

        await newXpConversion.save();
        
        // Poblar la referencia al RPPrice antes de enviar la respuesta
        await newXpConversion.populate('rpPrice');

        res.status(201).json(newXpConversion);
    } catch (error) {
        next(error);
    }
}

async function updateXpConversion(req, res, next) {
    try {
        const { id } = req.params;
        const { xpSeguro, xpBarato, active } = req.body;

        // Validar que al menos un campo para actualizar esté presente
        if (!xpSeguro && !xpBarato && active === undefined) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Se requiere al menos un campo para actualizar'
            );
        }

        // Buscar y actualizar la conversión
        const updatedXpConversion = await XpConversion.findByIdAndUpdate(
            id,
            { xpSeguro, xpBarato, active },
            { new: true, runValidators: true }
        ).populate('rpPrice');

        if (!updatedXpConversion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json(updatedXpConversion);
    } catch (error) {
        next(error);
    }
}

async function deleteXpConversion(req, res, next) {
    try {
        const { id } = req.params;
        
        const deletedXpConversion = await XpConversion.findByIdAndDelete(id);
        
        if (!deletedXpConversion) {
            throw new CustomError('Conversión no encontrada', 404);
        }

        res.status(200).json({
            message: 'Conversión eliminada exitosamente'
        });
    } catch (error) {
        next(error);
    }
}

// Función auxiliar para calcular XP basado en los RP
async function calculateXp(rpPriceId, isSeguro = true) {
    const conversion = await XpConversion.findOne({ 
        rpPrice: rpPriceId,
        active: true 
    });
    
    // Si no se encuentra una conversión activa, se retorna 0 XP
    if (!conversion) {
        return 0;
    }

    return isSeguro ? conversion.xpSeguro : conversion.xpBarato;
}

module.exports = {
    getAllXpConversions,
    createXpConversion,
    updateXpConversion,
    deleteXpConversion,
    calculateXp
};
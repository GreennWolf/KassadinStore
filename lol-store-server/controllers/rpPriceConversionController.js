const RPPriceConversion = require('../database/Models/RPPriceConversion');
const RPPrice = require('../database/Models/rpPrice');
const Currency = require('../database/Models/currencyModel');
const { CustomError } = require('../middlewares/errorHandler');

async function validateEntities(rpPriceId, currencyId) {
    const [existingRPPrice, existingCurrency] = await Promise.all([
        rpPriceId ? RPPrice.findById(rpPriceId) : null,
        currencyId ? Currency.findById(currencyId) : null
    ]);

    if (rpPriceId && !existingRPPrice) {
        throw new CustomError('RPPrice no encontrado', 404);
    }
    if (currencyId && !existingCurrency) {
        throw new CustomError('Currency no encontrada', 404);
    }
}

const rpPriceConversionController = {
    createRPPriceConversion: async (req, res, next) => {
        try {
            const { rpPrice, currency, priceSeguro,priceBarato } = req.body;

            if (!rpPrice || !currency || !priceSeguro || !priceBarato) {
                throw new CustomError('Todos los campos son requeridos', 400);
            }

            await validateEntities(rpPrice, currency);

            const newConversion = await RPPriceConversion.create({ rpPrice, currency, priceSeguro,priceBarato  });
            const populatedConversion = await RPPriceConversion.findById(newConversion._id)
                .populate('rpPrice')
                .populate('currency');

            res.status(201).json(populatedConversion);
        } catch (error) {
            if (error.code === 11000) {
                next(new CustomError('La conversión RPPrice y Currency ya existe', 409));
                return;
            }
            next(error);
        }
    },

    getAllRPPriceConversions: async (req, res, next) => {
        try {
            const conversions = await RPPriceConversion.find()
                .populate('rpPrice')
                .populate('currency');
            res.status(200).json(conversions);
        } catch (error) {
            next(error);
        }
    },

    updateRPPriceConversion: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { rpPrice, currency, priceSeguro,priceBarato ,active} = req.body;

            await validateEntities(rpPrice, currency);

            const updatedConversion = await RPPriceConversion.findByIdAndUpdate(
                id,
                { rpPrice, currency, priceSeguro,priceBarato ,active},
                { new: true, runValidators: true }
            ).populate('rpPrice').populate('currency');

            if (!updatedConversion) {
                throw new CustomError('Conversión no encontrada', 404);
            }

            res.status(200).json(updatedConversion);
        } catch (error) {
            if (error.code === 11000) {
                next(new CustomError('La conversión RPPrice y Currency ya existe', 409));
                return;
            }
            next(error);
        }
    },

    deleteRPPriceConversion: async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedConversion = await RPPriceConversion.findByIdAndUpdate(
                id,
                { active: false },
                { new: true, runValidators: true }
            );
            
            if (!deletedConversion) {
                throw new CustomError('Conversión no encontrada', 404);
            }
            
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    activeRPPriceConversion: async (req, res, next) => {
        try {
            const { id } = req.params;
            const activeConversion = await RPPriceConversion.findByIdAndUpdate(
                id,
                { active: true },
                { new: true, runValidators: true }
            );
            
            if (!activeConversion) {
                throw new CustomError('Conversión no encontrada', 404);
            }
            
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    },

    convertRPtoCurrency: async (req, res, next) => {
        try {
            const { rpPriceId, currencyId } = req.body;

            if (!rpPriceId || !currencyId) {
                throw new CustomError('rpPriceId y currencyId son requeridos', 400);
            }

            const conversion = await RPPriceConversion.findOne({ 
                rpPrice: rpPriceId, 
                currency: currencyId 
            });

            if (!conversion) {
                throw new CustomError('Conversión no encontrada', 404);
            }

            res.status(200).json({ priceSeguro:conversion.priceSeguro,PriceBarato:conversion.priceBarato });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = rpPriceConversionController;
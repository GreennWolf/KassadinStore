const PaymentMethodCurrency = require('../database/Models/PaymentMethodCurrency');
const PaymentMethod = require('../database/Models/paymentMethod');
const Currency = require('../database/Models/currencyModel');
const { CustomError } = require('../middlewares/errorHandler');

const paymentMethodCurrencyController = {
    setPaymentMethodCurrencies: async (req, res, next) => {
        try {
            const { paymentMethodId, currencyIds, isRestricted } = req.body;

            const paymentMethod = await PaymentMethod.findById(paymentMethodId);
            if (!paymentMethod) {
                throw new CustomError('Método de pago no encontrado', 404);
            }

            if (currencyIds?.length > 0) {
                const currencies = await Currency.find({ _id: { $in: currencyIds } });
                if (currencies.length !== currencyIds.length) {
                    throw new CustomError('Una o más divisas no encontradas', 404);
                }
            }

            const relation = await PaymentMethodCurrency.findOneAndUpdate(
                { paymentMethod: paymentMethodId },
                {
                    currencies: currencyIds || [],
                    isRestricted: isRestricted || false
                },
                { upsert: true, new: true }
            ).populate('currencies');

            res.json(relation);
        } catch (error) {
            next(error);
        }
    },

    getAvailableCurrencies: async (req, res, next) => {
        try {
            const { paymentMethodId } = req.params;

            const relation = await PaymentMethodCurrency.findOne({ 
                paymentMethod: paymentMethodId 
            }).populate('currencies');

            if (!relation || !relation.isRestricted) {
                const allCurrencies = await Currency.find();
                return res.json(allCurrencies);
            }

            res.json(relation.currencies);
        } catch (error) {
            next(error);
        }
    },

    getAllPaymentMethodCurrencies: async (req, res, next) => {
        try {
            const [relations, allPaymentMethods] = await Promise.all([
                PaymentMethodCurrency.find()
                    .populate('paymentMethod')
                    .populate('currencies'),
                PaymentMethod.find()
            ]);
            
            const relationsMap = new Map(
                relations.map(r => [r.paymentMethod._id.toString(), r])
            );
            
            const result = allPaymentMethods.map(method => {
                const relation = relationsMap.get(method._id.toString());
                if (!relation) {
                    return {
                        paymentMethod: method,
                        isRestricted: false,
                        currencies: []
                    };
                }
                return relation;
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    },

    removeRestrictions: async (req, res, next) => {
        try {
            const { paymentMethodId } = req.params;

            const result = await PaymentMethodCurrency.findOneAndDelete({ 
                paymentMethod: paymentMethodId 
            });

            // if (!result) {
            //     throw new CustomError('Método de pago no encontrado', 404);
            // }

            res.status(204).send('El metodo de pago no tiene restricciones');
        } catch (error) {
            next(error);
        }
    }
};

module.exports = paymentMethodCurrencyController;
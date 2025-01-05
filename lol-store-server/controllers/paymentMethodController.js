const PaymentMethod = require('../database/Models/paymentMethod');
const { CustomError } = require('../middlewares/errorHandler');

async function getAllPaymentMethods(req, res, next) {
    try {
        const paymentMethods = await PaymentMethod.find();
        res.status(200).json(paymentMethods);
    } catch (error) {
        next(error);
    }
}

async function createPaymentMethod(req, res, next) {
    try {
        const { method, details } = req.body;

        if (!method || !details?.length) {
            throw new CustomError(
                'Datos incompletos', 
                400, 
                'Método y detalles son requeridos'
            );
        }

        const invalidDetails = details.some(detail => !detail.title || !detail.description);
        if (invalidDetails) {
            throw new CustomError(
                'Datos inválidos',
                400,
                'Cada detalle debe tener título y descripción'
            );
        }

        const newPaymentMethod = new PaymentMethod({ method, details });
        await newPaymentMethod.save();
        res.status(201).json(newPaymentMethod);
    } catch (error) {
        next(error);
    }
}

async function updatePaymentMethod(req, res, next) {
    try {
        const { id } = req.params;
        const { method, details , active } = req.body;

        if (!method || !details?.length) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Método y detalles son requeridos'
            );
        }

        const invalidDetails = details.some(detail => !detail.title || !detail.description);
        if (invalidDetails) {
            throw new CustomError(
                'Datos inválidos',
                400,
                'Cada detalle debe tener título y descripción'
            );
        }

        console.log(active)

        const updatedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
            id,
            { method, details ,active},
            { new: true, runValidators: true }
        );

        if (!updatedPaymentMethod) {
            throw new CustomError('Método de pago no encontrado', 404);
        }

        res.status(200).json(updatedPaymentMethod);
    } catch (error) {
        next(error);
    }
}

async function deletePaymentMethod(req, res, next) {
    try {
        const { id } = req.params;
        const deletedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
            id,
            { active: false },
            { new: true, runValidators: true }
        );
        
        if (!deletedPaymentMethod) {
            throw new CustomError('Método de pago no encontrado', 404);
        }
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

async function activePaymentMethod(req, res, next) {
    try {
        const { id } = req.params;
        const activedPaymentMethod = await PaymentMethod.findByIdAndUpdate(
            id,
            { active: true },
            { new: true, runValidators: true }
        );
        
        if (!activedPaymentMethod) {
            throw new CustomError('Método de pago no encontrado', 404);
        }
        
        res.status(204).send();
    } catch (error) {
        next(error);
    }
}

module.exports = {
    createPaymentMethod,
    getAllPaymentMethods,
    updatePaymentMethod,
    deletePaymentMethod,
    activePaymentMethod
};
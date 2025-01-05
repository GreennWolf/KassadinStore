// controllers/cuponController.js
const Cupon = require('../database/Models/cuponsModel');
const CurrencyCupon = require('../database/Models/currencyCuponModel');

async function createCupon(req, res) {
    const { 
        cupon, 
        type, 
        value, 
        description,
        maxUses,
        validFrom,
        validUntil,
        isInfinite,
        isActive,
        currencyValues // Array de {currencyId, fixedValue} para cupones de tipo fixed
    } = req.body;

    try {
        const cuponData = {
            cupon,
            type,
            description,
            maxUses: maxUses || 0,
            currentUses: 0,
            validFrom: validFrom || new Date(),
            validUntil: isInfinite ? null : validUntil,
            isInfinite: isInfinite || false,
            isActive: isActive !== undefined ? isActive : true
        };

        if (type === 'percent') {
            cuponData.value = value;
        }

        // Crear el cupón base
        const newCupon = new Cupon(cuponData);
        await newCupon.save();

        // Si es tipo fixed, guardar los valores por moneda
        if (type === 'fixed' && Array.isArray(currencyValues)) {
            for (const currencyValue of currencyValues) {
                const { currencyId, fixedValue } = currencyValue;
                const newCurrencyCupon = new CurrencyCupon({
                    cupon: newCupon._id,
                    currency: currencyId,
                    value: fixedValue
                });
                await newCurrencyCupon.save();
            }
        }

        // Si es tipo fixed, obtener los valores por moneda para incluirlos en la respuesta
        let responseData = newCupon.toObject();
        if (type === 'fixed') {
            const currencyValues = await CurrencyCupon.find({ cupon: newCupon._id })
                .populate('currency', 'name symbol');
            responseData.currencyValues = currencyValues;
        }

        res.status(201).json(responseData);
    } catch (error) {
        console.error('Error al crear el cupón:', error);
        res.status(500).json({ message: 'Error al crear el cupón', error });
    }
}

async function getAllCupons(req, res) {
    try {
        const cupons = await Cupon.find();
        
        // Para cada cupón de tipo fixed, obtener sus valores en diferentes monedas
        const cuponsWithCurrencies = await Promise.all(cupons.map(async (cupon) => {
            const cuponObj = cupon.toObject();
            if (cupon.type === 'fixed') {
                const currencyValues = await CurrencyCupon.find({ cupon: cupon._id })
                    .populate('currency', 'name symbol');
                cuponObj.currencyValues = currencyValues;
            }
            return cuponObj;
        }));

        res.status(200).json(cuponsWithCurrencies);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener cupones', error });
    }
}

async function updateCupon(req, res) {
    const { id } = req.params;
    const updates = req.body;

    try {
        const cupon = await Cupon.findById(id);
        if (!cupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        // Actualizar el cupón base
        Object.keys(updates).forEach(key => {
            if (key !== 'currencyValues') {
                cupon[key] = updates[key];
            }
        });

        await cupon.save();

        // Si es tipo fixed y se proporcionan nuevos valores de moneda
        if (cupon.type === 'fixed' && updates.currencyValues) {
            // Eliminar valores anteriores
            await CurrencyCupon.deleteMany({ cupon: id });

            // Crear nuevos valores
            for (const currencyValue of updates.currencyValues) {
                const { currencyId, fixedValue } = currencyValue;
                await new CurrencyCupon({
                    cupon: id,
                    currency: currencyId,
                    value: fixedValue
                }).save();
            }
        }

        // Obtener el cupón actualizado con sus valores de moneda si es tipo fixed
        let responseData = cupon.toObject();
        if (cupon.type === 'fixed') {
            const currencyValues = await CurrencyCupon.find({ cupon: id })
                .populate('currency', 'name symbol');
            responseData.currencyValues = currencyValues;
        }

        res.status(200).json(responseData);
    } catch (error) {
        res.status(500).json({ message: 'Error al actualizar el cupón', error });
    }
}

async function deleteCupon(req, res) {
    const { id } = req.params;

    try {
        const cupon = await Cupon.findById(id);
        if (!cupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        // Si es tipo fixed, eliminar también los valores de moneda asociados
        if (cupon.type === 'fixed') {
            await CurrencyCupon.updateMany(
                {cupon:id},
                { active: false },
                { new: true, runValidators: true }
            );
        }

        await Cupon.findByIdAndUpdate(
            id,
            { isActive: false },
            { new: true, runValidators: true }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar cupón', error });
    }
}

async function activeCupon(req, res) {
    const { id } = req.params;

    try {
        const cupon = await Cupon.findById(id);
        if (!cupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        // Si es tipo fixed, eliminar también los valores de moneda asociados
        if (cupon.type === 'fixed') {
            await CurrencyCupon.updateMany(
                {cupon:id},
                { active: true },
                { new: true, runValidators: true }
            );
        }

        await Cupon.findByIdAndUpdate(
            id,
            { isActive: true },
            { new: true, runValidators: true }
        );
        res.status(204).send();
    } catch (error) {
        res.status(500).json({ message: 'Error al activar cupón', error });
    }
}


async function validateCupon(req, res) {
    const { cuponCode, currencyId } = req.body;

    try {
        const cupon = await Cupon.findOne({ cupon: cuponCode });
        if (!cupon) {
            return res.status(404).json({ message: 'Cupón no encontrado o inválido' });
        }

        // Verificar si el cupón está activo
        if (!cupon.isActive) {
            return res.status(400).json({ message: 'El cupón está inactivo' });
        }

        // Verificar si el cupón ha expirado
        if (!cupon.isInfinite && new Date() > new Date(cupon.validUntil)) {
            return res.status(400).json({ message: 'El cupón ha expirado' });
        }

        // Verificar si el cupón ha alcanzado el máximo de usos
        if (cupon.maxUses > 0 && cupon.currentUses >= cupon.maxUses) {
            return res.status(400).json({ message: 'El cupón ha alcanzado el máximo de usos' });
        }

        let discountValue = 0;

        if (cupon.type === 'percent') {
            discountValue = cupon.value;
        } else {
            const currencyCupon = await CurrencyCupon.findOne({
                cupon: cupon._id,
                currency: currencyId
            });

            if (!currencyCupon) {
                return res.status(404).json({ message: 'El cupón no es válido para esta moneda' });
            }

            discountValue = currencyCupon.value;
        }

        await cupon.save();

        res.status(200).json({ 
            _id:cupon._id,
            discountValue, 
            type: cupon.type,
            isValid: true,
            message: 'Cupón válido'
        });
    } catch (error) {
        console.error('Error al validar el cupón:', error);
        res.status(500).json({ message: 'Error al validar el cupón', error });
    }
}

async function getCuponById(req, res) {
    const { id } = req.params;

    try {
        // Buscar el cupón por ID
        const cupon = await Cupon.findById(id);
        if (!cupon) {
            return res.status(404).json({ message: 'Cupón no encontrado' });
        }

        // Si el cupón es de tipo 'fixed', obtener los valores por moneda
        let responseData = cupon.toObject();
        if (cupon.type === 'fixed') {
            const currencyValues = await CurrencyCupon.find({ cupon: id })
                .populate('currency', 'name symbol');
            responseData.currencyValues = currencyValues;
        }

        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error al obtener el cupón por ID:', error);
        res.status(500).json({ message: 'Error al obtener el cupón', error });
    }
}

module.exports = {
    createCupon,
    updateCupon,
    deleteCupon,
    getAllCupons,
    getCuponById,
    validateCupon,
    activeCupon
};
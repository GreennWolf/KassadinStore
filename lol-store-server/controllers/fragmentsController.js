const FragmentsPreset = require('../database/Models/FragmentsPreset');
const FragmentsUser = require('../database/Models/FragmentsUser');

// Crear un nuevo preset de fragmentos
exports.createFragmentsPreset = async (req, res, next) => {
  try {
    const preset = await FragmentsPreset.create(req.body);
    res.status(201).json({ success: true, data: preset });
  } catch (error) {
    next(error);
  }
};

// Obtener todos los presets activos
exports.getFragmentsPresets = async (req, res, next) => {
  try {
    const presets = await FragmentsPreset.find({ isActive: true });
    res.status(200).json({ success: true, data: presets });
  } catch (error) {
    next(error);
  }
};

// Actualizar un preset de fragmentos
exports.updateFragmentsPreset = async (req, res, next) => {
  try {
    const preset = await FragmentsPreset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!preset) {
      return res.status(404).json({ success: false, message: "FragmentsPreset not found" });
    }
    res.status(200).json({ success: true, data: preset });
  } catch (error) {
    next(error);
  }
};

// Desactivar (o eliminar lógicamente) un preset
exports.deleteFragmentsPreset = async (req, res, next) => {
  try {
    const preset = await FragmentsPreset.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!preset) {
      return res.status(404).json({ success: false, message: "FragmentsPreset not found" });
    }
    res.status(200).json({ success: true, data: preset });
  } catch (error) {
    next(error);
  }
};

// Obtener los fragmentos de un usuario
exports.getUserFragments = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const fragments = await FragmentsUser.find({ userId, isActive: true });
    res.status(200).json({ success: true, data: fragments });
  } catch (error) {
    next(error);
  }
};

// Actualizar la cantidad de fragmentos de un usuario (suma o resta)
exports.updateUserFragments = async (req, res, next) => {
  try {
    const { userId, fragmentId } = req.params;
    // Se espera en req.body un campo "fragmentQuantity" (puede ser positivo o negativo)
    let userFragment = await FragmentsUser.findOne({ userId, fragmentId });
    if (!userFragment) {
      // Si no existe y se intenta sumar fragmentos, se crea el registro
      if (req.body.fragmentQuantity > 0) {
        const newRecord = await FragmentsUser.create({ userId, fragmentId, fragmentQuantity: req.body.fragmentQuantity });
        return res.status(201).json({ success: true, data: newRecord });
      }
      return res.status(404).json({ success: false, message: "User fragment record not found" });
    }
    userFragment.fragmentQuantity += req.body.fragmentQuantity;
    if (userFragment.fragmentQuantity < 0) userFragment.fragmentQuantity = 0;
    await userFragment.save();
    res.status(200).json({ success: true, data: userFragment });
  } catch (error) {
    next(error);
  }
};

// Canjear (exchange) fragmentos: el usuario puede canjear un preset si tiene la cantidad requerida
exports.exchangeFragments = async (req, res, next) => {
  try {
    const { userId, presetId } = req.params;
    // Obtener el preset de fragmentos
    const preset = await FragmentsPreset.findById(presetId);
    if (!preset) {
      return res.status(404).json({ success: false, message: "FragmentsPreset not found" });
    }
    // Obtener el registro de fragmentos del usuario para este preset
    let userFragment = await FragmentsUser.findOne({ userId, fragmentId: presetId });
    if (!userFragment || userFragment.fragmentQuantity < preset.requiredQuantity) {
      return res.status(400).json({ success: false, message: "Insufficient fragments to exchange" });
    }
    // Deducir la cantidad necesaria
    userFragment.fragmentQuantity -= preset.requiredQuantity;
    await userFragment.save();
    // Aquí se puede agregar la lógica para otorgar la recompensa al usuario
    res.status(200).json({ 
      success: true, 
      message: "Exchange successful", 
      data: { reward: preset, remainingFragments: userFragment.fragmentQuantity } 
    });
  } catch (error) {
    next(error);
  }
};

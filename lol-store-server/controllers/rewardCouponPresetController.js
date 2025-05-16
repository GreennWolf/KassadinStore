const RewardCouponPreset = require('../database/Models/rewardCouponPreset');

const rewardCouponPresetController = {
  // Crear un nuevo preset de cupones de recompensa
  createRewardCouponPreset: async (req, res, next) => {
    try {
      const { name, percent, validDays, maxUses,rpType,rpPrice,maxApplicableSkins,applicableTo,type,gold , isActive } = req.body;
      
      const newPreset = new RewardCouponPreset({
        name,
        percent,
        validDays,
        maxUses,
        rpPrice,
        rpType,
        applicableTo,
        maxApplicableSkins,
        type,
        gold:gold != 0 ? gold : 0,
        isActive: isActive !== undefined ? isActive : true
      });

      await newPreset.save();
      res.status(201).json(newPreset);
    } catch (error) {
      next(error);
    }
  },

  // Obtener un preset de cupones por ID
  getRewardCouponPresetById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const preset = await RewardCouponPreset.findById(id);
      if (!preset) {
        return res.status(404).json({ message: 'Reward coupon preset not found' });
      }
      res.json(preset);
    } catch (error) {
      next(error);
    }
  },

  // Obtener todos los presets de cupones
  getAllRewardCouponPresets: async (req, res, next) => {
    try {
      const presets = await RewardCouponPreset.find();
      res.json(presets);
    } catch (error) {
      next(error);
    }
  },

  getCouponByType: async (req, res, next) => {
    try {
        const { type } = req.params;

        // Asegurar que el parámetro `type` es válido
        if (!type || (type !== "store" && type !== "lootbox")) {
            return res.status(400).json({ message: "Tipo de cupón inválido. Debe ser 'store' o 'lootbox'." });
        }

        // Filtrar por type en la base de datos
        const presets = await RewardCouponPreset.find({ type });

        // Si no se encuentran cupones, devolver un mensaje amigable
        if (!presets.length) {
            return res.status(404).json({ message: "No se encontraron cupones con ese tipo." });
        }

        res.json(presets);
    } catch (error) {
        next(error);
    }
},

  // Actualizar un preset de cupones
  updateRewardCouponPreset: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const preset = await RewardCouponPreset.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!preset) {
        return res.status(404).json({ message: 'Reward coupon preset not found' });
      }
      res.json(preset);
    } catch (error) {
      next(error);
    }
  },

  // Eliminar un preset de cupones
  deleteRewardCouponPreset: async (req, res, next) => {
    try {
      const { id } = req.params;

      // Buscar el cupón por ID
      const preset = await RewardCouponPreset.findById(id);
      if (!preset) {
          return res.status(404).json({ message: "Reward coupon preset not found" });
      }

      // Cambiar el estado de isActive (true <-> false)
      preset.isActive = !preset.isActive;

      // Guardar los cambios en la base de datos
      await preset.save();

      res.status(200).json({
          message: `Cupón ${preset.isActive ? "activado" : "desactivado"} exitosamente`,
          preset
      });
  } catch (error) {
      next(error);
  }
  }
};

module.exports = rewardCouponPresetController;

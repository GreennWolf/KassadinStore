const Rank = require('../database/Models/ranksModel');
const { CustomError } = require('../middlewares/errorHandler');
const fs = require('fs');
const path = require('path');

// Helper function para asegurar que existe el directorio de iconos
function ensureIconDirectoryExists() {
    const uploadDir = path.join(__dirname, '../public/RankIcons');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}

async function getAllRanks(req, res, next) {
    try {
        const ranks = await Rank.find().sort({ xp: 1 }); // Ordenados por XP de menor a mayor
        res.status(200).json(ranks);
    } catch (error) {
        next(error);
    }
}

async function createRank(req, res, next) {
    try {
        const { name, xp, gold } = req.body;

        // Validar campos requeridos
        if (!name || !xp || !gold) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'Todos los campos son requeridos'
            );
        }

        // Validar que no exista un rango con el mismo nombre o XP
        const existingRank = await Rank.findOne({
            $or: [{ name }, { xp }]
        });

        if (existingRank) {
            throw new CustomError(
                'Rango duplicado',
                400,
                'Ya existe un rango con ese nombre o nivel de XP'
            );
        }

        // Manejar el icono
        if (!req.file) {
            throw new CustomError(
                'Archivo no proporcionado',
                400,
                'Se requiere un icono'
            );
        }

        const uploadDir = ensureIconDirectoryExists();
        const icon = req.file;
        const fileExtension = path.extname(icon.originalname);
        const fileName = `${name.toLowerCase().replace(/\s+/g, '-')}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);
        console.log(icon)
        // Mover icono al directorio de destino
        fs.renameSync(icon.path, filePath);

        // Crear nuevo rango
        const newRank = new Rank({
            name,
            xp,
            gold,
            icon: `/RankIcons/${fileName}`
        });

        await newRank.save();

        res.status(201).json(newRank);
    } catch (error) {
        next(error);
    }
}

async function updateRank(req, res, next) {
    try {
        const { id } = req.params;
        const { name, xp, gold } = req.body;
        const oldRank = await Rank.findById(id);

        if (!oldRank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Verificar duplicados solo si se está actualizando nombre o XP
        if (name || xp) {
            const existingRank = await Rank.findOne({
                _id: { $ne: id },
                $or: [
                    ...(name ? [{ name }] : []),
                    ...(xp ? [{ xp }] : [])
                ]
            });

            if (existingRank) {
                throw new CustomError(
                    'Rango duplicado',
                    400,
                    'Ya existe un rango con ese nombre o nivel de XP'
                );
            }
        }

        let updateData = { name, xp, gold };

        // Manejar actualización de icono si se proporciona
        if (req.file) {
            const uploadDir = ensureIconDirectoryExists();

            // Eliminar icono anterior
            const oldPath = path.join(__dirname, '..', oldRank.icon);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }

            // Guardar nuevo icono
            const icon = req.file;
            const fileExtension = path.extname(icon.originalname);
            const fileName = `${(name || oldRank.name).toLowerCase().replace(/\s+/g, '-')}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            fs.renameSync(icon.path, filePath);

            updateData.icon = `/RankIcons/${fileName}`;
        }

        // Actualizar rango
        const updatedRank = await Rank.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedRank);
    } catch (error) {
        next(error);
    }
}

async function deleteRank(req, res, next) {
    try {
        const { id } = req.params;
        const rank = await Rank.findById(id);

        if (!rank) {
            throw new CustomError('Rango no encontrado', 404);
        }

        // Eliminar icono del sistema de archivos
        const filePath = path.join(__dirname, '..', rank.icon);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Eliminar rango de la base de datos
        await Rank.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Rango eliminado exitosamente'
        });
    } catch (error) {
        next(error);
    }
}

// Función auxiliar para obtener el rango basado en XP
async function getRankByXp(xp) {
    try {
        const rank = await Rank.findOne({
            xp: { $lte: xp }
        }).sort({ xp: -1 });

        return rank || null;
    } catch (error) {
        throw error;
    }
}

// Función para obtener el siguiente rango
async function getNextRank(req, res, next) {
    try {
        const { currentXp } = req.params;
        const xp = parseInt(currentXp);

        const currentRank = await getRankByXp(xp);
        if (!currentRank) {
            return res.status(200).json({
                nextRank: await Rank.findOne().sort({ xp: 1 }),
                xpNeeded: 0
            });
        }

        const nextRank = await Rank.findOne({
            xp: { $gt: currentRank.xp }
        }).sort({ xp: 1 });

        if (!nextRank) {
            return res.status(200).json({
                message: 'Has alcanzado el rango máximo',
                currentRank
            });
        }

        res.status(200).json({
            currentRank,
            nextRank,
            xpNeeded: nextRank.xp - xp
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllRanks,
    createRank,
    updateRank,
    deleteRank,
    getRankByXp,
    getNextRank
};

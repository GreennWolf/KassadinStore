const PerfilImage = require('../database/Models/perfilImage');
const User = require('../database/Models/userModel');
const { CustomError } = require('../middlewares/errorHandler');
const fs = require('fs');
const path = require('path');

// Helper function to ensure upload directory exists
function ensureUploadDirectoryExists() {
    const uploadDir = path.join(__dirname, '../public/PerfilImage');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
}

// Helper function to get default profile image
async function getDefaultProfileImage() {
    const defaultImage = await PerfilImage.findOne({ name: 'default' });
    if (!defaultImage) {
        throw new CustomError(
            'Imagen por defecto no encontrada',
            500,
            'No se ha configurado una imagen por defecto'
        );
    }
    return defaultImage;
}

async function getAllPerfilImages(req, res, next) {
    try {
        const perfilImages = await PerfilImage.find();
        res.status(200).json(perfilImages);
    } catch (error) {
        next(error);
    }
}

async function createPerfilImage(req, res, next) {
    try {
        if (!req.files || !req.files.image) {
            throw new CustomError(
                'Archivo no proporcionado',
                400,
                'Se requiere una imagen'
            );
        }

        const { name } = req.body;
        if (!name) {
            throw new CustomError(
                'Datos incompletos',
                400,
                'El nombre es requerido'
            );
        }

        const uploadDir = ensureUploadDirectoryExists();
        const image = req.files.image;
        const fileExtension = path.extname(image.name);
        const fileName = `${name}${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Save image to filesystem
        await image.mv(filePath);

        // Save to database
        const newPerfilImage = new PerfilImage({
            name,
            src: `/PerfilImage/${fileName}`
        });
        await newPerfilImage.save();

        res.status(201).json(newPerfilImage);
    } catch (error) {
        next(error);
    }
}

async function updatePerfilImage(req, res, next) {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const oldImage = await PerfilImage.findById(id);

        if (!oldImage) {
            throw new CustomError('Imagen de perfil no encontrada', 404);
        }

        let updateData = { name };
        const uploadDir = ensureUploadDirectoryExists();

        // Handle new image upload if provided
        if (req.files && req.files.image) {
            // Delete old image if it's not the default
            if (oldImage.name !== 'default') {
                const oldPath = path.join(__dirname, '..', oldImage.src);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }

            // Save new image
            const image = req.files.image;
            const fileExtension = path.extname(image.name);
            const fileName = `${name}${fileExtension}`;
            const filePath = path.join(uploadDir, fileName);
            await image.mv(filePath);

            updateData.src = `/PerfilImage/${fileName}`;
        }

        const updatedPerfilImage = await PerfilImage.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json(updatedPerfilImage);
    } catch (error) {
        next(error);
    }
}

async function deletePerfilImage(req, res, next) {
    try {
        const { id } = req.params;
        const perfilImage = await PerfilImage.findById(id);

        if (!perfilImage) {
            throw new CustomError('Imagen de perfil no encontrada', 404);
        }

        // Don't allow deletion of default image
        if (perfilImage.name === 'default') {
            throw new CustomError(
                'Operación no permitida',
                400,
                'No se puede eliminar la imagen por defecto'
            );
        }

        // Get default image for users who were using the deleted image
        const defaultImage = await getDefaultProfileImage();

        // Update all users who were using this image to use the default image
        await User.updateMany(
            { perfilImage: id },
            { perfilImage: defaultImage._id }
        );

        // Delete file from filesystem
        const filePath = path.join(__dirname, '..', perfilImage.src);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Remove from database
        await PerfilImage.findByIdAndDelete(id);

        res.status(200).json({
            message: 'Imagen eliminada y usuarios actualizados con imagen por defecto',
            defaultImageId: defaultImage._id
        });
    } catch (error) {
        next(error);
    }
}

// New function to create default profile image
async function createDefaultProfileImage(req, res, next) {
    try {
        if (!req.files || !req.files.image) {
            throw new CustomError(
                'Archivo no proporcionado',
                400,
                'Se requiere una imagen'
            );
        }

        const uploadDir = ensureUploadDirectoryExists();
        const image = req.files.image;
        const fileExtension = path.extname(image.name);
        const fileName = `default${fileExtension}`;
        const filePath = path.join(uploadDir, fileName);

        // Check if default image already exists
        const existingDefault = await PerfilImage.findOne({ name: 'default' });
        if (existingDefault) {
            // Delete old default image file
            const oldPath = path.join(__dirname, '..', existingDefault.src);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            // Update existing default image
            await image.mv(filePath);
            existingDefault.src = `/PerfilImage/${fileName}`;
            await existingDefault.save();
            return res.status(200).json(existingDefault);
        }

        // Save new default image
        await image.mv(filePath);
        const newDefaultImage = new PerfilImage({
            name: 'default',
            src: `/PerfilImage/${fileName}`
        });
        await newDefaultImage.save();

        res.status(201).json(newDefaultImage);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getAllPerfilImages,
    createPerfilImage,
    updatePerfilImage,
    deletePerfilImage,
    createDefaultProfileImage
};

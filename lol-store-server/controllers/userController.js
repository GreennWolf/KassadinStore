const User = require('../database/Models/userModel');
const bcrypt = require('bcrypt');
const { CustomError } = require('../middlewares/errorHandler');
const PerfilImage = require('../database/Models/perfilImage');
;

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

const userController = {
    registerUser: async (req, res, next) => {
        try {
            const { fullName, username, email, password, role } = req.body;
    
            if (!fullName || !username || !email || !password) {
                throw new CustomError('Todos los campos son requeridos', 400);
            }
    
            const existingUser = await User.findOne({
                $or: [{ username }, { email }]
            });
    
            if (existingUser) {
                throw new CustomError(
                    'Usuario ya existe',
                    409,
                    existingUser.email === email ? 'Email en uso' : 'Username en uso'
                );
            }
    
            // Get all active profile images
            const availableImages = await PerfilImage.find();
            
            if (availableImages.length === 0) {
                throw new CustomError(
                    'Error de configuración',
                    500,
                    'No hay imágenes de perfil disponibles en el sistema'
                );
            }
    
            // Select a random profile image
            const randomIndex = Math.floor(Math.random() * availableImages.length);
            const selectedImage = availableImages[randomIndex];
    
            const hashedPassword = await hashPassword(password);
            
            const newUser = await User.create({
                fullName,
                username,
                email,
                password: hashedPassword,
                role: !role ? 'user' : role,
                perfilImage: selectedImage._id,
            });
    
            // Prepare user response without password
            const userResponse = newUser.toObject();
            delete userResponse.password;
    
            // Populate the profile image details
            const populatedUser = await User.findById(newUser._id)
                .select('-password')
                .populate('perfilImage').populate('rank');
    
            res.status(201).json({ 
                message: 'Usuario registrado exitosamente',
                user: populatedUser 
            });
        } catch (error) {
            next(error);
        }
    },

    loginUser: async (req, res, next) => {
        try {
            const { identifier, password } = req.body;

            if (!identifier || !password) {
                throw new CustomError('Credenciales incompletas', 400);
            }

            const user = await User.findOne({
                $or: [{ username: identifier }, { email: identifier }]
            }).populate('perfilImage').populate('rank');

            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                throw new CustomError('Credenciales inválidas', 401);
            }

            const userResponse = user.toObject();
            delete userResponse.password;

            res.status(200).json({ 
                message: 'Inicio de sesión exitoso',
                user: userResponse 
            });
        } catch (error) {
            next(error);
        }
    },

    updateUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { fullName, username, email, password,role} = req.body;

            if (!Object.keys(req.body).length) {
                throw new CustomError('No hay datos para actualizar', 400);
            }

            const updates = {};
            if (fullName) updates.fullName = fullName;
            if (username) updates.username = username;
            if (email) updates.email = email;
            if(role) updates.role = role
            if (password) {
                updates.password = await hashPassword(password);
            }

            const updatedUser = await User.findByIdAndUpdate(
                id,
                updates,
                { new: true }
            );

            if (!updatedUser) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            const userResponse = updatedUser.toObject();
            delete userResponse.password;

            res.status(200).json({
                message: 'Perfil actualizado exitosamente',
                user: userResponse
            });
        } catch (error) {
            next(error);
        }
    },

    getUsers: async (req, res, next) => {
        try {
            const users = await User.find().select('-password').populate('perfilImage').populate('rank');
            res.status(200).json(users);
        } catch (error) {
            next(error);
        }
    },

    getUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const user = await User.findById(id)
                .select('-password')
                .populate('perfilImage')
                .populate('rank');
                
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }
            
            res.status(200).json(user);
        } catch (error) {
            next(error);
        }
     },

    deleteUser: async (req, res, next) => {
        try {
            const { id } = req.params;
            const deletedUser = await User.findByIdAndDelete(id);

            if (!deletedUser) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            res.status(200).json({ 
                message: 'Usuario eliminado exitosamente' 
            });
        } catch (error) {
            next(error);
        }
    }
};

module.exports = userController;
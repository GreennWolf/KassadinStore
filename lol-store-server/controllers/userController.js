const User = require('../database/Models/userModel');
const bcrypt = require('bcrypt');
const { CustomError } = require('../middlewares/errorHandler');
const PerfilImage = require('../database/Models/perfilImage');
const VerificationToken = require('../database/Models/verificationToken')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const jwt = require('jsonwebtoken');

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
                verified: false // Agregamos el campo verified
            });
    
            // Generar token de verificación
            const verificationToken = jwt.sign(
                { userId: newUser._id },
                process.env.JWT_SECRET || 'tu-secreto-jwt', // Idealmente usar variable de entorno
                { expiresIn: '1h' }
            );
    
            // Guardar el token en la base de datos
            await VerificationToken.create({
                userId: newUser._id,
                token: verificationToken
            });
    
            // Enviar email de verificación
            try {
                await sendVerificationEmail(email, verificationToken);
            } catch (emailError) {
                console.error('Error al enviar email de verificación:', emailError);
                // No lanzamos el error para no interrumpir el registro
            }
    
            // Prepare user response without password
            const userResponse = newUser.toObject();
            delete userResponse.password;
            
            // Populate the profile image details
            const populatedUser = await User.findById(newUser._id)
                .select('-password')
                .populate('perfilImage')
                .populate('rank');
    
            res.status(201).json({ 
                message: 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.',
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

            if (!user.verified) {
                // Generar nuevo token de verificación
                const verificationToken = jwt.sign(
                    { userId: user._id },
                    process.env.JWT_SECRET || 'tu-secreto-jwt',
                    { expiresIn: '1h' }
                );

                // Eliminar token anterior si existe
                await VerificationToken.deleteOne({ userId: user._id });

                // Guardar nuevo token
                await VerificationToken.create({
                    userId: user._id,
                    token: verificationToken
                });

                // Enviar nuevo email de verificación
                try {
                    await sendVerificationEmail(user.email, verificationToken);
                } catch (emailError) {
                    console.error('Error al enviar email de verificación:', emailError);
                }

                throw new CustomError(
                    'Por favor verifica tu correo electrónico. Se ha enviado un nuevo código de verificación.',
                    401
                );
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
    },
    verifyEmail: async (req, res, next) => {
        try {
            const { token } = req.params;
            
            const verificationToken = await VerificationToken.findOne({ token });
            if (!verificationToken) {
                // Buscar al usuario por el token expirado/inválido
                const decodedToken = jwt.decode(token);
                if (!decodedToken || !decodedToken.userId) {
                    throw new CustomError('Token inválido', 400);
                }

                const user = await User.findById(decodedToken.userId);
                if (!user) {
                    throw new CustomError('Usuario no encontrado', 404);
                }

                // Generar nuevo token
                const newToken = jwt.sign(
                    { userId: user._id },
                    process.env.JWT_SECRET || 'tu-secreto-jwt',
                    { expiresIn: '1h' }
                );

                // Eliminar token anterior
                await VerificationToken.deleteOne({ userId: user._id });

                // Guardar nuevo token
                await VerificationToken.create({
                    userId: user._id,
                    token: newToken
                });

                // Enviar nuevo email
                await sendVerificationEmail(user.email, newToken);

                throw new CustomError(
                    'Token expirado. Se ha enviado un nuevo enlace de verificación a tu correo.',
                    400
                );
            }
    
            const user = await User.findById(verificationToken.userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }
    
            user.verified = true;
            await user.save();
            await VerificationToken.deleteOne({ token });
    
            res.status(200).json({ 
                message: 'Usuario verificado exitosamente' 
            });
        } catch (error) {
            next(error);
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { id } = req.params;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                throw new CustomError('Se requiere la contraseña actual y la nueva', 400);
            }

            const user = await User.findById(id);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            // Verificar la contraseña actual
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                throw new CustomError('Contraseña actual incorrecta', 401);
            }

            // Hash de la nueva contraseña
            const hashedPassword = await hashPassword(newPassword);
            
            // Actualizar la contraseña
            user.password = hashedPassword;
            await user.save();

            res.status(200).json({
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            if (!email) {
                throw new CustomError('El email es requerido', 400);
            }

            const user = await User.findOne({ email });
            if (!user) {
                throw new CustomError('No existe una cuenta con este email', 404);
            }

            // Generar token para reseteo de contraseña
            const resetToken = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET || 'tu-secreto-jwt',
                { expiresIn: '1h' }
            );

            // Guardar token en la base de datos (usando el mismo modelo VerificationToken)
            // Primero eliminar cualquier token existente
            await VerificationToken.deleteOne({ userId: user._id });

            await VerificationToken.create({
                userId: user._id,
                token: resetToken,
                type: 'password-reset' // Opcional: para diferenciar tipos de tokens
            });

            // Enviar email con el enlace de reseteo
            await sendPasswordResetEmail(email, resetToken);

            res.status(200).json({
                message: 'Se ha enviado un enlace para restablecer tu contraseña al correo proporcionado'
            });
        } catch (error) {
            next(error);
        }
    },

    // Verificar token de reseteo de contraseña
    verifyResetToken: async (req, res, next) => {
        try {
            const { token } = req.params;

            // Verificar que el token existe y es válido
            const resetToken = await VerificationToken.findOne({ token });
            if (!resetToken) {
                throw new CustomError('Token inválido o expirado', 400);
            }

            // Verificar que el token no ha expirado usando jwt
            try {
                jwt.verify(token, process.env.JWT_SECRET || 'tu-secreto-jwt');
            } catch (error) {
                // Si el token expiró, eliminarlo y notificar
                await VerificationToken.deleteOne({ token });
                throw new CustomError('Token expirado', 400);
            }

            // Verificar que el usuario existe
            const user = await User.findById(resetToken.userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            // Si todo está bien, retornar éxito
            res.status(200).json({
                message: 'Token válido',
                userId: user._id // Esto puede ser útil para el frontend
            });
        } catch (error) {
            next(error);
        }
    },

    // Función para establecer la nueva contraseña
    resetPassword: async (req, res, next) => {
        try {
            const { token } = req.params;
            const { newPassword } = req.body;

            if (!newPassword) {
                throw new CustomError('La nueva contraseña es requerida', 400);
            }

            // Verificar que el token existe
            const resetToken = await VerificationToken.findOne({ token });
            if (!resetToken) {
                throw new CustomError('Token inválido o expirado', 400);
            }

            // Verificar que el token no ha expirado
            try {
                jwt.verify(token, process.env.JWT_SECRET || 'tu-secreto-jwt');
            } catch (error) {
                await VerificationToken.deleteOne({ token });
                throw new CustomError('Token expirado', 400);
            }

            // Buscar al usuario
            const user = await User.findById(resetToken.userId);
            if (!user) {
                throw new CustomError('Usuario no encontrado', 404);
            }

            // Actualizar la contraseña
            const hashedPassword = await hashPassword(newPassword);
            user.password = hashedPassword;
            await user.save();

            // Eliminar el token usado
            await VerificationToken.deleteOne({ token });

            res.status(200).json({
                message: 'Contraseña actualizada exitosamente'
            });
        } catch (error) {
            next(error);
        }
    },
updateUserGold: async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount, operation } = req.body;

        // Validar que se proporcionen los campos necesarios
        if (!amount || !operation) {
            throw new CustomError('Se requiere la cantidad y el tipo de operación', 400);
        }

        // Validar que el amount sea un número
        if (isNaN(amount)) {
            throw new CustomError('La cantidad debe ser un número', 400);
        }

        // Validar que la operación sea válida
        if (!['sumar', 'restar', 'cambiar'].includes(operation)) {
            throw new CustomError('Operación no válida. Debe ser "sumar", "restar" o "cambiar"', 400);
        }

        // Buscar el usuario
        const user = await User.findById(id);
        if (!user) {
            throw new CustomError('Usuario no encontrado', 404);
        }

        // Realizar la operación correspondiente
        switch (operation) {
            case 'sumar':
                user.gold += Number(amount);
                break;
            case 'restar':
                // Modificación: Si el oro quedaría negativo, establecerlo a 0
                if (user.gold < Number(amount)) {
                    user.gold = 0; // Establecer a 0 en lugar de lanzar un error
                } else {
                    user.gold -= Number(amount);
                }
                break;
            case 'cambiar':
                user.gold = Number(amount);
                break;
        }

        // Guardar los cambios
        await user.save();

        // Responder con el usuario actualizado (sin la contraseña)
        const userResponse = user.toObject();
        delete userResponse.password;

        // Buscar el usuario con sus relaciones para devolver
        const populatedUser = await User.findById(user._id)
            .select('-password')
            .populate('perfilImage')
            .populate('rank');

        res.status(200).json({
            message: 'Oro actualizado exitosamente',
            user: populatedUser
        });
    } catch (error) {
        next(error);
    }
},
updateMultipleUsersGold: async (req, res, next) => {
    try {
        const { users } = req.body;

        // Validar que se proporcione un array de usuarios
        if (!users || !Array.isArray(users) || users.length === 0) {
            throw new CustomError('Se requiere un array de usuarios', 400);
        }

        const results = [];
        const errors = [];

        // Procesar cada usuario
        for (const userOp of users) {
            const { id, amount, operation } = userOp;

            // Validar que se proporcionen los campos necesarios
            if (!id || !amount || !operation) {
                errors.push({
                    id: id || 'unknown',
                    error: 'Falta id, amount u operation para este usuario'
                });
                continue;
            }

            // Validar que el amount sea un número
            if (isNaN(amount)) {
                errors.push({
                    id,
                    error: 'La cantidad debe ser un número'
                });
                continue;
            }

            // Validar que la operación sea válida
            if (!['sumar', 'restar', 'cambiar'].includes(operation)) {
                errors.push({
                    id,
                    error: 'Operación no válida. Debe ser "sumar", "restar" o "cambiar"'
                });
                continue;
            }

            try {
                // Buscar el usuario
                const user = await User.findById(id);
                if (!user) {
                    errors.push({
                        id,
                        error: 'Usuario no encontrado'
                    });
                    continue;
                }

                // Guardar valor antiguo para el reporte
                const oldGold = user.gold;

                // Realizar la operación correspondiente
                switch (operation) {
                    case 'sumar':
                        user.gold += Number(amount);
                        break;
                    case 'restar':
                        // Modificación: Si el oro quedaría negativo, establecerlo a 0
                        if (user.gold < Number(amount)) {
                            user.gold = 0; // Establecer a 0 en lugar de rechazar
                        } else {
                            user.gold -= Number(amount);
                        }
                        break;
                    case 'cambiar':
                        user.gold = Number(amount);
                        break;
                }

                // Guardar los cambios
                await user.save();

                // Añadir al resultado
                results.push({
                    id,
                    username: user.username,
                    operation,
                    amount: Number(amount),
                    oldGold,
                    newGold: user.gold,
                    success: true,
                    wasAdjustedToZero: operation === 'restar' && oldGold < Number(amount) // Indicar si fue ajustado a 0
                });
            } catch (userError) {
                errors.push({
                    id,
                    error: userError.message || 'Error al procesar este usuario'
                });
            }
        }

        // Obtener todos los usuarios actualizados para devolver su información completa
        const updatedUsers = await Promise.all(
            results.map(async (result) => {
                const user = await User.findById(result.id)
                    .select('-password')
                    .populate('perfilImage')
                    .populate('rank');
                return user;
            })
        );

        // Contar cuántos usuarios fueron ajustados a 0
        const adjustedToZeroCount = results.filter(r => r.wasAdjustedToZero).length;

        res.status(200).json({
            message: `Oro actualizado para ${results.length} usuarios. ${errors.length} errores. ${adjustedToZeroCount > 0 ? `${adjustedToZeroCount} usuarios quedaron con 0 oro.` : ''}`,
            results,
            errors,
            users: updatedUsers,
            totalProcessed: users.length,
            successCount: results.length,
            errorCount: errors.length,
            adjustedToZeroCount: adjustedToZeroCount
        });
    } catch (error) {
        next(error);
    }
}
};

module.exports = userController;
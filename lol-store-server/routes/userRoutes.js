const express = require('express');
const {
    registerUser,
    loginUser,
    updateUser,
    getUsers,
    getUser,
    deleteUser,
    verifyEmail,
    changePassword,
    forgotPassword,
    verifyResetToken,
    resetPassword,
    updateUserGold,
    updateMultipleUsersGold
} = require('../controllers/userController');

const config = require('../config/config');

const router = express.Router();

// Rutas de autenticación básica
router.post('/register', registerUser);
router.post('/login', loginUser);

// Rutas de recuperación de contraseña
router.post('/forgot-password', forgotPassword); // Envía el email de recuperación
router.get('/verify-reset-token/:token', verifyResetToken); // Verifica si el token es válido
router.post('/reset-password/:token', resetPassword); // Establece la nueva contraseña

// Rutas de gestión de contraseña
router.put('/change-password/:id', changePassword); // Cambio de contraseña cuando el usuario está logueado

// Rutas de gestión de usuarios
router.get('/getUsers', getUsers);
router.get('/getUser/:id', getUser);
router.put('/edit/:id', updateUser);
router.delete('/delete/:id', deleteUser);

router.put('/update-gold/:id', updateUserGold);
router.put('/update-multiple-gold', updateMultipleUsersGold);

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        environment: config.env,
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
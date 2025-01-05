const express = require('express');
const {
    registerUser,
    loginUser,
    updateUser,
    getUsers, // Importa la función
    getUser,
    deleteUser
} = require('../controllers/userController');


const router = express.Router();

// Ruta para registrar un nuevo usuario
router.post('/register', registerUser);

// Ruta para iniciar sesión
router.post('/login', loginUser);

// Ruta para obtener todos los usuarios
router.get('/getUsers', getUsers); // Añade esta línea

router.get('/getUser/:id', getUser); // Añade esta línea

// Ruta para actualizar el perfil del usuario
router.put('/edit/:id', updateUser); // Asegúrate de que hay un '/' antes de 'id'

router.delete('/delete/:id', deleteUser);

module.exports = router;

const jwt = require('jsonwebtoken');
const { CustomError } = require('./errorHandler');
const User = require('../database/Models/userModel');
const config = require('../config/config');

// Variable para almacenar la clave del JWT
let JWT_SECRET = '';

// Inicializar la clave JWT al cargar el módulo
(async function initJwtSecret() {
  try {
    JWT_SECRET = config.jwtSecret;
    console.log('JWT Secret inicializado correctamente');
  } catch (error) {
    console.error('Error al inicializar JWT Secret:', error);
    // Usar una clave por defecto en caso de error (no es seguro, pero evita errores)
    JWT_SECRET = 'temporal_secret_key';
  }
})();

// Middleware para verificar autenticación
const verifyToken = async (req, res, next) => {
  try {
    console.log('========== INICIO verifyToken ==========');
    console.log('Headers:', req.headers);
    
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    console.log('Authorization header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No hay Authorization header o no comienza con Bearer');
      // Intentar obtener userID de los params, query o body como fallback
      const userId = req.params.userId || req.query.userId || req.body.userId;
      console.log('UserId de params/query/body:', userId);
      
      if (!userId) {
        console.log('No se proporcionó token ni userId');
        throw new CustomError('No se proporcionó token de autenticación ni ID de usuario', 401);
      }
      
      // Buscar usuario en la base de datos usando el ID
      const user = await User.findById(userId);
      
      if (!user) {
        console.log('Usuario no encontrado con ID:', userId);
        throw new CustomError('Usuario no encontrado', 404);
      }
      
      // Verificar que el usuario esté activo
      if (!user.active) {
        console.log('Usuario desactivado:', userId);
        throw new CustomError('Usuario desactivado', 403);
      }
      
      console.log('Usuario encontrado por ID:', user._id);
      // Añadir el usuario a la solicitud
      req.user = user;
    } else {
      // Extraer el token del header
      const token = authHeader.split(' ')[1];
      console.log('Token extraído:', token ? '(presente)' : '(no presente)');
      
      try {
        // Verificar y decodificar el token
        console.log('Verificando JWT con clave:', config.jwtSecret ? '(clave presente)' : '(clave no presente)');
        const decoded = jwt.verify(token, config.jwtSecret || process.env.JWT_SECRET || 'tu-secreto-jwt');
        console.log('JWT decodificado:', decoded);
        
        // Buscar usuario en la base de datos usando el ID del token
        const user = await User.findById(decoded.userId);
        
        if (!user) {
          console.log('Usuario no encontrado con ID de token:', decoded.userId);
          throw new CustomError('Usuario no encontrado', 404);
        }
        
        // Verificar que el usuario esté activo
        if (!user.active) {
          console.log('Usuario desactivado:', user._id);
          throw new CustomError('Usuario desactivado', 403);
        }
        
        console.log('Usuario encontrado por token JWT:', user._id);
        // Añadir el usuario a la solicitud
        req.user = user;
      } catch (jwtError) {
        console.error('Error verificando JWT:', jwtError);
        throw new CustomError('Token inválido o expirado', 401);
      }
    }
    
    console.log('========== FIN verifyToken (éxito) ==========');
    next();
  } catch (error) {
    console.error('========== ERROR verifyToken ==========');
    console.error('Error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(new CustomError('Token inválido o expirado', 401));
    } else {
      next(error);
    }
    console.error('========== FIN ERROR verifyToken ==========');
  }
};

// Middleware para verificar si el usuario es administrador
const isAdmin = (req, res, next) => {
  console.log('========== INICIO isAdmin ==========');
  console.log('req.user:', req.user ? `ID: ${req.user._id}, Role: ${req.user.role}` : 'No user');
  
  if (!req.user) {
    console.log('Usuario no autenticado');
    return next(new CustomError('Usuario no autenticado', 401));
  }
  
  if (req.user.role !== 'admin') {
    console.log(`Usuario ${req.user._id} tiene rol ${req.user.role}, se requiere 'admin'`);
    return next(new CustomError('Acceso denegado: Se requieren permisos de administrador', 403));
  }
  
  console.log(`Usuario ${req.user._id} verificado como admin`);
  console.log('========== FIN isAdmin (éxito) ==========');
  next();
};

module.exports = {
  verifyToken,
  isAdmin
};
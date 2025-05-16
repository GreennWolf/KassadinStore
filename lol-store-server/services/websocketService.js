/**
 * Servicio de WebSockets para comunicación en tiempo real con el cliente
 * Este servicio configura y gestiona las conexiones WebSocket
 */

const socketIO = require('socket.io');
let io = null;

/**
 * Inicializa el servicio de WebSockets
 * @param {http.Server} server - Servidor HTTP
 */
function initialize(server) {
  // Configurar Socket.IO con CORS activado
  io = socketIO(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 
              ['https://ksdinstore.com', 'http://localhost:3000', 'http://localhost:8080'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Manejar conexiones
  io.on('connection', socket => {
    console.log('Cliente WebSocket conectado:', socket.id);

    // Unirse a la sala de progreso de un trabajo específico
    socket.on('join-job', jobId => {
      socket.join(`job-${jobId}`);
      console.log(`Cliente ${socket.id} unido a sala de trabajo ${jobId}`);
    });

    // Dejar la sala de progreso de un trabajo
    socket.on('leave-job', jobId => {
      socket.leave(`job-${jobId}`);
      console.log(`Cliente ${socket.id} dejó la sala de trabajo ${jobId}`);
    });

    // Unirse a la sala de administración (para transmisiones generales)
    socket.on('join-admin', () => {
      socket.join('admin');
      console.log(`Cliente ${socket.id} unido a sala de administración`);
    });

    // Dejar la sala de administración
    socket.on('leave-admin', () => {
      socket.leave('admin');
      console.log(`Cliente ${socket.id} dejó la sala de administración`);
    });

    // Cuando el cliente se desconecta
    socket.on('disconnect', () => {
      console.log('Cliente WebSocket desconectado:', socket.id);
    });
  });

  console.log('Servicio WebSocket inicializado');
  return io;
}

/**
 * Emite una actualización de progreso de un trabajo específico
 * @param {string} jobId - ID del trabajo
 * @param {object} progressData - Datos del progreso
 */
function emitJobProgress(jobId, progressData) {
  if (!io) return;
  io.to(`job-${jobId}`).emit('job-progress', { jobId, ...progressData });
}

/**
 * Emite un evento de trabajo completado
 * @param {string} jobId - ID del trabajo
 * @param {object} result - Resultado del trabajo
 */
function emitJobCompleted(jobId, result) {
  if (!io) return;
  io.to(`job-${jobId}`).emit('job-completed', { jobId, result });
}

/**
 * Emite un evento de trabajo fallido
 * @param {string} jobId - ID del trabajo
 * @param {object} error - Error que causó la falla
 */
function emitJobFailed(jobId, error) {
  if (!io) return;
  io.to(`job-${jobId}`).emit('job-failed', { 
    jobId, 
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    } 
  });
}

/**
 * Emite un mensaje a todos los clientes admin conectados
 * @param {string} event - Nombre del evento
 * @param {any} data - Datos a enviar
 */
function emitToAdmin(event, data) {
  if (!io) return;
  io.to('admin').emit(event, data);
}

/**
 * Obtiene la instancia de Socket.IO
 * @returns {SocketIO.Server} Instancia de Socket.IO
 */
function getIO() {
  return io;
}

module.exports = {
  initialize,
  emitJobProgress,
  emitJobCompleted,
  emitJobFailed,
  emitToAdmin,
  getIO
};
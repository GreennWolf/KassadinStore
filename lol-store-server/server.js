const express = require('express');
const http = require('http');
const { connectToDatabase } = require('./database/db'); // Importar la conexión a la base de datos
const config = require('./config/config');
const championRoutes = require('./routes/championRoutes');
const scrapeRoutes = require('./routes/scrapeRoutes');
const cors = require('cors'); // Importa cors
const path = require('path'); // Importa path
const fs = require('fs'); // Para manejo de archivos
const websocketService = require('./services/websocketService'); // Servicio de WebSockets
const dotenv = require('dotenv');
// Importar sistema de logs si existe, si no usar console directamente
let logger;
try {
    logger = require('./utils/logger');
    // Activar el override de console.log para guardar todos los logs en archivos
    logger.overrideConsole();
    // Log inicial
    logger.log('Iniciando servidor Kassadin Store...');
} catch (error) {
    console.log('Sistema de logs no disponible, usando console directamente');
    // Crear un logger falso para que el código funcione sin cambios
    logger = {
        log: console.log,
        error: console.error,
        stockUpdate: console.log,
        overrideConsole: () => {}
    };
}

// Cargar variables de entorno
dotenv.config();
const userRoutes = require('./routes/userRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const paymentMethodRoutes = require('./routes/paymentMethodRoutes');
const bodyParser = require('body-parser');
const currencyRoutes = require('./routes/currencyRoutes')
const itemRoutes = require('./routes/itemRoutes')
const rpConvertion = require('./routes/rpPriceConversionRoutes')
const cuponRoutes = require('./routes/cuponRoutes')
const PaymentMethodCurrency = require('./routes/paymentMethodCurrencyRoutes')
const perfilImage = require('./routes/perfilImageRoutes')
const rankRoutes = require('./routes/rankRoutes')
const xpConvertionRoutes = require('./routes/xpConvertionRoutes')
const lootBoxRoutes = require('./routes/lootBoxRoutes')
const inventoryRoutes = require('./routes/inventoryRoutes')
const goldConvertionRoutes = require('./routes/goldConvertionRoutes')
const unrankedRoutes = require('./routes/unrankedRoutes')
const rewardCouponPresetRoutes = require('./routes/rewardCouponPresetRoutes')
const fragmentsRoutes = require('./routes/fragmentsRoutes');
const rewardsRedeemRoutes = require('./routes/rewardsRedeemRoutes')
const eloBoostRoutes = require('./routes/eloBoostRoutes')
const { errorHandler } = require('./middlewares/errorHandler');
const { verifyEmail } = require('./controllers/userController');
const dashboardRoutes = require('./routes/dashboardRoutes');
const progressRoutes = require('./routes/progressRoutes');
// Importar el cron job para actualización de campeones
const { updateChampionIcons } = require('./scripts/scrapeCronJob');

const app = express();

// Conectar a la base de datos
connectToDatabase();

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors(config.corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rutas
app.use('/api', championRoutes);
app.use('/api', scrapeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/currencies', currencyRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/rpConvertion',rpConvertion );
app.use('/api/cupon', cuponRoutes);
app.use('/api/payment-method-currencies', PaymentMethodCurrency);
app.use('/api/perfil-images',perfilImage );
app.use('/api/ranks',rankRoutes );
app.use('/api/xp-convertions',xpConvertionRoutes );
app.use('/api/lootboxes',lootBoxRoutes );
app.use('/api/inventory',inventoryRoutes );
app.use('/api/gold-convertions', goldConvertionRoutes);
app.use('/api/rewardcouponpreset', rewardCouponPresetRoutes);
app.use('/api/unrankeds', unrankedRoutes);
app.use('/api/fragments', fragmentsRoutes);
app.use('/api/redeems', rewardsRedeemRoutes);
app.use('/api/eloboost', eloBoostRoutes);
app.get('/verify/:token', verifyEmail);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/progress', progressRoutes);
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/chromas', express.static(path.join(__dirname, 'public/chromas')));
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));
app.use('/items', express.static(path.join(__dirname, 'public/items')));
app.use('/currencys', express.static(path.join(__dirname, 'public/currencys')));
app.use('/PerfilImage', express.static(path.join(__dirname, 'public/PerfilImage')));
app.use('/RankIcons', express.static(path.join(__dirname, 'public/RankIcons')));
app.use('/lootbox', express.static(path.join(__dirname, 'public/lootbox')));
app.use('/logo', express.static(path.join(__dirname, 'public/Logo.png')));
app.use('/unrankeds', express.static(path.join(__dirname, 'public/unrankeds')));
app.use('/champions', express.static(path.join(__dirname, 'public/champions')));
app.use('/chromas', express.static(path.join(__dirname, 'public')));

// Ruta de diagnóstico (temporal)
const diagnosticRoutes = require('./routes/diagnosticRoutes');
app.use('/api/diagnostic', diagnosticRoutes);

app.use(errorHandler);


// Middleware para manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Middleware para parsear JSON
app.use(bodyParser.json());

// Middleware para parsear URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));



// Crear servidor HTTP y configurar WebSockets
const port = process.env.PORT || 3000;
const server = http.createServer(app);

// Inicializar servicio de WebSockets
websocketService.initialize(server);

// Iniciar el servidor
server.listen(port, () => {
    logger.log(`Servidor ejecutándose en modo ${config.env} en el puerto ${port}`);
    
    // Verificar que el directorio de logs exista
    const logsDir = path.join(__dirname, 'logs');
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }
    logger.log('Directorio de logs: ' + logsDir);
    
    // Log específico para actualizaciones de stock
    logger.stockUpdate('=== INICIANDO SISTEMA DE SEGUIMIENTO DE STOCK ===');
    logger.stockUpdate('El sistema de seguimiento de stock está activo y registrará todas las actualizaciones de stock');
    
    // Ejecutar la actualización de iconos de campeones al iniciar el servidor
    logger.log('Iniciando actualización de iconos de campeones...');
    updateChampionIcons()
        .then(() => logger.log('Actualización de iconos de campeones completada'))
        .catch(err => logger.error('Error al actualizar iconos de campeones:', err));
});

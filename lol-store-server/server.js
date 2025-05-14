const express = require('express');
const { connectToDatabase } = require('./database/db'); // Importar la conexión a la base de datos
const config = require('./config/config');
const championRoutes = require('./routes/championRoutes');
const scrapeRoutes = require('./routes/scrapeRoutes');
const cors = require('cors'); // Importa cors
const path = require('path'); // Importa path
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
const { errorHandler } = require('./middlewares/errorHandler');
const { verifyEmail } = require('./controllers/userController');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Conectar a la base de datos
connectToDatabase();

// Middlewares
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: ['https://ksdinstore.com', 'http://localhost:3000', 'http://localhost:8080'], // Agrega todos los orígenes permitidos
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    credentials: true,
    maxAge: 86400 // 24 horas
}));

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
app.get('/verify/:token', verifyEmail);
app.use('/api/dashboard', dashboardRoutes);
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



// Iniciar el servidor
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor ejecutándose en el puerto ${port}`);
});

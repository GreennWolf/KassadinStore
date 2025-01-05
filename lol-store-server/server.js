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
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Conectar a la base de datos
connectToDatabase();

// Middlewares
app.use(cors({
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type'],
}));
app.use(express.json());
app.use(errorHandler);

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
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/chromas', express.static(path.join(__dirname, 'public/chromas')));
app.use('/receipts', express.static(path.join(__dirname, 'public/receipts')));
app.use('/items', express.static(path.join(__dirname, 'public/items')));
app.use('/currencys', express.static(path.join(__dirname, 'public/currencys')));
app.use('/PerfilImage', express.static(path.join(__dirname, 'public/PerfilImage')));
app.use('/RankIcons', express.static(path.join(__dirname, 'public/RankIcons')));
app.use('/lootbox', express.static(path.join(__dirname, 'public/lootbox')));

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

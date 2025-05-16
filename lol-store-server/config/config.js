require('dotenv').config();

module.exports = {
    championsUrl: 'https://wiki.leagueoflegends.com/en-us/List_of_champions',
    baseUrlForSkins: 'https://wiki.leagueoflegends.com/en-us/',
    baseUrlWiki: 'https://wiki.leagueoflegends.com/en-us/',
    imageFolderPath: './public/images',
    chromaFolderPath: './public/chromas',
    dbConfig: {
        uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/KassadinStore',
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    },
    jwtConfig: {
        secret: process.env.JWT_SECRET || 'default-secret-key',
        expiresIn: process.env.JWT_EXPIRATION || '7d'
    },
    emailConfig: {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL_FROM || 'support@ksdinstore.com'
    },
    frontendURL: process.env.FRONTEND_URL || 'http://localhost:8080',
    corsOptions: {
        origin: (process.env.ALLOWED_ORIGINS || '').split(','),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
        credentials: true,
        maxAge: 86400 // 24 hours
    },
    env: process.env.NODE_ENV || 'development'
};
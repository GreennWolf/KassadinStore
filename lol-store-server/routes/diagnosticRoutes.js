const express = require('express');
const router = express.Router();
const User = require('../database/Models/userModel');

// Endpoint temporal para diagnosticar problemas de registro
router.get('/check-users', async (req, res) => {
    try {
        const { email, username } = req.query;
        
        const result = {
            totalUsers: await User.countDocuments(),
            emailCheck: null,
            usernameCheck: null
        };
        
        if (email) {
            result.emailCheck = await User.findOne({ email });
        }
        
        if (username) {
            result.usernameCheck = await User.findOne({ username });
        }
        
        // Buscar usuarios duplicados
        const emailDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$email",
                    count: { $sum: 1 },
                    usernames: { $push: "$username" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        const usernameDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$username",
                    count: { $sum: 1 },
                    emails: { $push: "$email" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        result.duplicates = {
            byEmail: emailDuplicates,
            byUsername: usernameDuplicates
        };
        
        // Verificar índices
        const indexes = await User.collection.getIndexes();
        result.indexes = indexes;
        
        res.json(result);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Endpoint para corregir índices
router.post('/fix-indexes', async (req, res) => {
    try {
        // Eliminar duplicados manteniendo solo el más reciente
        const emailDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$email",
                    count: { $sum: 1 },
                    docs: { $push: { _id: "$_id", createdAt: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        let deletedCount = 0;
        
        for (const duplicate of emailDuplicates) {
            // Ordenar por fecha de creación (mantener el más reciente)
            const sortedDocs = duplicate.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            // Eliminar todos menos el más reciente
            const toDelete = sortedDocs.slice(1).map(doc => doc._id);
            
            if (toDelete.length > 0) {
                await User.deleteMany({ _id: { $in: toDelete } });
                deletedCount += toDelete.length;
            }
        }
        
        // Hacer lo mismo para username
        const usernameDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$username",
                    count: { $sum: 1 },
                    docs: { $push: { _id: "$_id", createdAt: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);
        
        for (const duplicate of usernameDuplicates) {
            const sortedDocs = duplicate.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            const toDelete = sortedDocs.slice(1).map(doc => doc._id);
            
            if (toDelete.length > 0) {
                await User.deleteMany({ _id: { $in: toDelete } });
                deletedCount += toDelete.length;
            }
        }
        
        // Recrear índices
        await User.collection.dropIndexes();
        await User.collection.createIndex({ _id: 1 });
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ username: 1 }, { unique: true });
        
        res.json({
            message: 'Índices corregidos',
            deletedDuplicates: deletedCount,
            indexes: await User.collection.getIndexes()
        });
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;
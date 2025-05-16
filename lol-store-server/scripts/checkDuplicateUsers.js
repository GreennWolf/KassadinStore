// Verificar y limpiar usuarios duplicados
const mongoose = require('mongoose');
const User = require('../database/Models/userModel');
const config = require('../config/config');

mongoose.connect(config.dbConfig.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function checkDuplicateUsers() {
    try {
        // Buscar usuarios duplicados por email
        const emailDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$email",
                    count: { $sum: 1 },
                    users: { $push: { _id: "$_id", username: "$username", created: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        // Buscar usuarios duplicados por username
        const usernameDuplicates = await User.aggregate([
            {
                $group: {
                    _id: "$username",
                    count: { $sum: 1 },
                    users: { $push: { _id: "$_id", email: "$email", created: "$createdAt" } }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log('Duplicados por email:', emailDuplicates.length);
        console.log('Duplicados por username:', usernameDuplicates.length);

        if (emailDuplicates.length > 0 || usernameDuplicates.length > 0) {
            console.log('\n--- Detalles de duplicados ---');
            
            if (emailDuplicates.length > 0) {
                console.log('\nEmails duplicados:');
                emailDuplicates.forEach(dup => {
                    console.log(`Email: ${dup._id} (${dup.count} usuarios)`);
                    dup.users.forEach(user => {
                        console.log(`  - ID: ${user._id}, Username: ${user.username}, Creado: ${user.created}`);
                    });
                });
            }

            if (usernameDuplicates.length > 0) {
                console.log('\nUsernames duplicados:');
                usernameDuplicates.forEach(dup => {
                    console.log(`Username: ${dup._id} (${dup.count} usuarios)`);
                    dup.users.forEach(user => {
                        console.log(`  - ID: ${user._id}, Email: ${user.email}, Creado: ${user.created}`);
                    });
                });
            }
        } else {
            console.log('No se encontraron usuarios duplicados');
        }

        // Verificar índices
        const indexes = await User.collection.getIndexes();
        console.log('\n--- Índices actuales ---');
        console.log(JSON.stringify(indexes, null, 2));

        // Verificar si los índices únicos están correctamente configurados
        const hasEmailIndex = Object.keys(indexes).some(key => indexes[key].email === 1);
        const hasUsernameIndex = Object.keys(indexes).some(key => indexes[key].username === 1);

        if (!hasEmailIndex || !hasUsernameIndex) {
            console.log('\n⚠️  Los índices únicos NO están configurados correctamente');
            console.log('Recreando índices...');
            
            try {
                // Eliminar índices existentes menos el _id
                await User.collection.dropIndexes();
                
                // Crear índices únicos
                await User.collection.createIndex({ email: 1 }, { unique: true });
                await User.collection.createIndex({ username: 1 }, { unique: true });
                
                console.log('✅ Índices únicos recreados correctamente');
            } catch (error) {
                console.error('Error al recrear índices:', error);
            }
        } else {
            console.log('\n✅ Los índices únicos están configurados correctamente');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

checkDuplicateUsers();
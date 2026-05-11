require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
require('dotenv').config();

// Configuración de conexión
const uri = process.env.MONGODB_URI || "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// Función para cifrar en SHA256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Datos de ejemplo para los 5 usuarios
const rawUsers = [
    { username: 'leonardo_perez', pass: 'telematica2026', email: 'leonardo.perez@ejemplo.com', telefono: '5512345678', telegramChatId: '111111111' },
    { username: 'admin_control', pass: 'password123', email: 'admin.control@ejemplo.com', telefono: '5523456789', telegramChatId: '222222222' },
    { username: 'sensor_hub', pass: 'iot_secure_pass', email: 'sensor.hub@ejemplo.com', telefono: '5534567890', telegramChatId: '333333333' },
    { username: 'test_user', pass: 'abc12345', email: 'test.user@ejemplo.com', telefono: '5545678901', telegramChatId: '444444444' },
    { username: 'root_dev', pass: 'root_access_77', email: 'root.dev@ejemplo.com', telefono: '5556789012', telegramChatId: '555555555' }
];

async function run() {
    try {
        await client.connect();
        const db = client.db('Usuarios');

        const usuariosCol = db.collection('usuarios');
        const passwordCol = db.collection('password');
        const correoCol = db.collection('correo');
        const telefonoCol = db.collection('telefono');
        const telegramCol = db.collection('telegram');

        // Limpiar colecciones anteriores para evitar duplicados (Opcional)
        await usuariosCol.deleteMany({});
        await passwordCol.deleteMany({});
        await correoCol.deleteMany({});
        await telefonoCol.deleteMany({});
        await telegramCol.deleteMany({});

        console.log("Iniciando la creación de usuarios...");

        for (const user of rawUsers) {
            // 1. Insertar en la colección 'usuarios'
            await usuariosCol.insertOne({ username: user.username });

            // 2. Insertar en la colección 'password' con el hash SHA256
            await passwordCol.insertOne({
                username: user.username,
                hash: hashPassword(user.pass)
            });

            // 3. Insertar en la colección 'correo'
            await correoCol.insertOne({
                username: user.username,
                correo: user.email
            });

            // 4. Insertar en la colección 'telefono'
            await telefonoCol.insertOne({
                username: user.username,
                telefono: user.telefono
            });

            // 5. Insertar en la colección 'telegram'
            await telegramCol.insertOne({
                username: user.username,
                chatId: user.telegramChatId
            });

            console.log(`Usuario '${user.username}' creado con éxito.`);
        }

        console.log("\nConfiguración finalizada. Se han agregado 5 usuarios con datos de 2FA.");

    } catch (err) {
        console.error("Error durante la inicialización:", err);
    } finally {
        await client.close();
    }
}

run();
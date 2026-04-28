require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// Configuración de conexión (Asegúrate de usar tus credenciales)
const uri = "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// Función para cifrar en SHA256
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Datos de ejemplo para los 5 usuarios
const rawUsers = [
    { username: 'leonardo_perez', pass: 'telematica2026' },
    { username: 'admin_control', pass: 'password123' },
    { username: 'sensor_hub', pass: 'iot_secure_pass' },
    { username: 'test_user', pass: 'abc12345' },
    { username: 'root_dev', pass: 'root_access_77' }
];

async function run() {
    try {
        await client.connect();
        const db = client.db('Usuarios');

        const usuariosCol = db.collection('usuarios');
        const passwordCol = db.collection('password');

        // Limpiar colecciones anteriores para evitar duplicados (Opcional)
        await usuariosCol.deleteMany({});
        await passwordCol.deleteMany({});

        console.log("Iniciando la creación de usuarios...");

        for (const user of rawUsers) {
            // 1. Insertar en la colección 'usuarios'
            await usuariosCol.insertOne({ username: user.username });

            // 2. Insertar en la colección 'password' con el hash SHA256
            await passwordCol.insertOne({
                username: user.username,
                hash: hashPassword(user.pass)
            });

            console.log(`Usuario '${user.username}' creado con éxito.`);
        }

        console.log("\nConfiguración finalizada. Se han agregado 5 usuarios.");

    } catch (err) {
        console.error("Error durante la inicialización:", err);
    } finally {
        await client.close();
    }
}

run();
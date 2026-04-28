require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require('express');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Reemplaza con tus credenciales de Atlas
const uri = "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("Conexión establecida con MongoDB Atlas");
    } catch (error) {
        console.error("Error de conexión:", error);
    }
}
connectDB();

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Acceso a la base de datos de credenciales
        const dbUsuarios = client.db('Usuarios');
        const usuariosCol = dbUsuarios.collection('usuarios');
        const passwordCol = dbUsuarios.collection('password');

        // Acceso a la base de datos de pines (NUEVA)
        const dbPines = client.db('pines');
        const pinesCol = dbPines.collection('pines_activos');

        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Verificación de usuario y contraseña
        const userExists = await usuariosCol.findOne({ username: username });
        if (!userExists) {
            return res.json({ status: 0, resultado: 0 });
        }

        const passRecord = await passwordCol.findOne({ username, hash: hashPassword });

        if (passRecord) {
            // 1. Generar PIN de 4 dígitos
            let pinValue = Math.trunc(Math.random() * 10000).toString().padStart(4, '0');

            // 2. Calcular tiempos (Creación y Expiración a los 3 minutos)
            const tiempoCreacion = new Date();
            const tiempoFinaliza = new Date(tiempoCreacion.getTime() + 3 * 60000); // + 3 minutos

            // 3. Guardar en la base de datos 'pines'
            const nuevoPin = {
                usuario: username,
                pin: pinValue,
                creado: tiempoCreacion,
                expira: tiempoFinaliza
            };

            await pinesCol.insertOne(nuevoPin);

            return res.json({
                status: 1,
                resultado: 1,
                pin: pinValue,
                expira: tiempoFinaliza
            });
        } else {
            return res.json({ status: 0, resultado: 0 });
        }

    } catch (error) {
        console.error("Error en el servicio de login:", error);
        res.status(500).json({ status: 0, msg: "Error interno" });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor activo en http://localhost:${PORT}`);
});
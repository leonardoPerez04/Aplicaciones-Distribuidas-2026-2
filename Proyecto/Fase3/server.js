require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const express = require('express');
const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

// Importar Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración de MongoDB
const uri = process.env.MONGODB_URI || "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";
const client = new MongoClient(uri);

// Configuración de Telegram Bot
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
let bot = null;

if (TELEGRAM_TOKEN && TELEGRAM_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
    bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
    console.log("✓ Bot de Telegram inicializado");
} else {
    console.warn(" Token de Telegram no configurado. Los PINs se mostrarán en consola.");
}

// Conectar a MongoDB
async function connectDB() {
    try {
        await client.connect();
        console.log("✓ Conexión establecida con MongoDB Atlas");
    } catch (error) {
        console.error("✗ Error de conexión:", error);
    }
}
connectDB();

/**
 * POST /api/login
 * Autentica usuario con contraseña y genera un PIN de 2FA
 */
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // Acceso a las colecciones
        const dbUsuarios = client.db('Usuarios');
        const usuariosCol = dbUsuarios.collection('usuarios');
        const passwordCol = dbUsuarios.collection('password');
        const telegramCol = dbUsuarios.collection('telegram');

        // Acceso a la base de datos de pines
        const dbPines = client.db('pines');
        const pinesCol = dbPines.collection('pines_activos');

        // Validar entrada
        if (!username || !password) {
            return res.status(400).json({ status: 0, resultado: 0, msg: "Usuario y contraseña son requeridos" });
        }

        const hashPassword = crypto.createHash('sha256').update(password).digest('hex');

        // Verificación de usuario
        const userExists = await usuariosCol.findOne({ username: username });
        if (!userExists) {
            return res.json({ status: 0, resultado: 0, msg: "Usuario no encontrado" });
        }

        // Verificación de contraseña
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
                expira: tiempoFinaliza,
                verificado: false
            };

            await pinesCol.insertOne(nuevoPin);

            // 4. Obtener Telegram Chat ID y enviar PIN
            const telegramRecord = await telegramCol.findOne({ username });
            
            if (bot && telegramRecord && telegramRecord.chatId) {
                try {
                    const mensaje = ` Tu código de verificación 2FA es: <b>${pinValue}</b>\n\n⏰ Válido por 3 minutos.`;
                    await bot.sendMessage(telegramRecord.chatId, mensaje, { parse_mode: 'HTML' });
                    console.log(`✓ PIN enviado a Telegram para usuario: ${username}`);
                } catch (telegramError) {
                    console.warn(` Error al enviar PIN por Telegram: ${telegramError.message}`);
                    // Continuar de todas formas, mostrar en consola
                    console.log(` PIN para ${username}: ${pinValue}`);
                }
            } else if (!bot) {
                console.log(` PIN para ${username}: ${pinValue}`);
            }

            return res.json({
                status: 1,
                resultado: 1,
                msg: "PIN generado. Revisa tu Telegram.",
                sessionId: username, // Será usado en verify-pin
                expira: tiempoFinaliza
            });
        } else {
            return res.json({ status: 0, resultado: 0, msg: "Contraseña incorrecta" });
        }

    } catch (error) {
        console.error("Error en el servicio de login:", error);
        res.status(500).json({ status: 0, msg: "Error interno del servidor" });
    }
});

/**
 * POST /api/verify-pin
 * Verifica el PIN ingresado por el usuario
 */
app.post('/api/verify-pin', async (req, res) => {
    const { username, pin } = req.body;

    try {
        // Validar entrada
        if (!username || !pin) {
            return res.status(400).json({ status: 0, resultado: 0, msg: "Usuario y PIN son requeridos" });
        }

        const dbPines = client.db('pines');
        const pinesCol = dbPines.collection('pines_activos');

        // Buscar el PIN más reciente del usuario
        const pinRecord = await pinesCol.findOne(
            { usuario: username },
            { sort: { creado: -1 } }
        );

        if (!pinRecord) {
            return res.json({ status: 0, resultado: 0, msg: "No hay PIN pendiente" });
        }

        // Verificar que el PIN no haya expirado
        const ahora = new Date();
        if (ahora > pinRecord.expira) {
            return res.json({ status: 0, resultado: 0, msg: "PIN expirado" });
        }

        // Verificar que el PIN coincida
        if (pinRecord.pin !== pin) {
            return res.json({ status: 0, resultado: 0, msg: "PIN incorrecto" });
        }

        // 2FA exitoso - Marcar PIN como verificado
        await pinesCol.updateOne(
            { _id: pinRecord._id },
            { $set: { verificado: true } }
        );

        // Generar token de sesión (simple para demostración)
        const sessionToken = crypto.randomBytes(32).toString('hex');

        return res.json({
            status: 1,
            resultado: 1,
            msg: "Autenticación 2FA exitosa",
            sessionToken: sessionToken,
            usuario: username
        });

    } catch (error) {
        console.error("Error en la verificación de PIN:", error);
        res.status(500).json({ status: 0, msg: "Error interno del servidor" });
    }
});

/**
 * GET /api/user-info
 * Obtiene información del usuario (requiere verificación previa)
 */
app.get('/api/user-info/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const dbUsuarios = client.db('Usuarios');
        const correoCol = dbUsuarios.collection('correo');
        const telefonoCol = dbUsuarios.collection('telefono');

        const correoRecord = await correoCol.findOne({ username });
        const telefonoRecord = await telefonoCol.findOne({ username });

        if (!correoRecord && !telefonoRecord) {
            return res.json({ status: 0, msg: "Usuario no encontrado" });
        }

        return res.json({
            status: 1,
            usuario: username,
            correo: correoRecord ? correoRecord.correo : "No registrado",
            telefono: telefonoRecord ? telefonoRecord.telefono : "No registrado"
        });

    } catch (error) {
        console.error("Error al obtener información del usuario:", error);
        res.status(500).json({ status: 0, msg: "Error interno del servidor" });
    }
});

app.listen(PORT, () => {
    console.log(`\n Servidor activo en http://localhost:${PORT}`);
    console.log(`   Endpoints disponibles:`);
    console.log(`   - POST /api/login (usuario + contraseña)`);
    console.log(`   - POST /api/verify-pin (usuario + PIN de 2FA)`);
    console.log(`   - GET /api/user-info/:username\n`);
});

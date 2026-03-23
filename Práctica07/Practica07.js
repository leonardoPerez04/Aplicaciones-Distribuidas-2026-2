/**
 * @file Practica07.js
 * @description Servidor REST construido con Express.js que demuestra distintos
 *              tipos de endpoints (GET y POST) y operaciones básicas con MongoDB.
 *
 * @requires express   - Framework para crear el servidor HTTP y definir rutas.
 * @requires mongodb   - Driver oficial de MongoDB para Node.js.
 *
 * Instalación de dependencias:
 *   npm install express mongodb
 *
 * Ejecución:
 *   node Practica07.js
 *
 * El servidor escucha en el puerto 3000.
 */

// Configura los servidores DNS que usará Node.js para resolver nombres de dominio.
// Se usan los DNS de Cloudflare (1.1.1.1) y Google (8.8.8.8).
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

var express = require("express");
var app = express(); // Instancia principal de Express; contenedor de Endpoints / Web Services RESTful

const { MongoClient } = require("mongodb");

/** @type {MongoClient} Cliente de conexión a MongoDB */
var client = 0;

/** @type {string} Nombre de la base de datos */
var dbName = "";

/** @type {string} Nombre de la colección */
var collectionName = "";

/** @type {import('mongodb').Db} Referencia a la base de datos */
var database = 0;

/** @type {import('mongodb').Collection} Referencia a la colección */
var collection = 0;

// Middleware para parsear cuerpos JSON y formularios URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * @function prepareDB
 * @description Inicializa las referencias a la base de datos y la colección
 *              que se usarán en las operaciones de MongoDB.
 *              La base de datos y la colección se crean automáticamente en
 *              MongoDB si no existen al momento de la primera escritura.
 */
function prepareDB() {
    dbName = "myDatabase";
    collectionName = "recipes";

    database = client.db(dbName);
    collection = database.collection(collectionName);
}

/**
 * @function connectDB
 * @async
 * @description Crea y abre la conexión al clúster de MongoDB Atlas usando
 *              la URI de conexión. El driver establece la conexión real en
 *              cuanto se necesita ejecutar una operación.
 */
async function connectDB() {
    const uri =
        "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";

    client = new MongoClient(uri);
    await client.connect();
}

// ---------------------------------------------------------------------------
// ENDPOINTS
// ---------------------------------------------------------------------------

/**
 * @route   GET /
 * @summary Endpoint raíz de prueba.
 * @returns {Object} JSON con mensaje informativo.
 *
 * Ejemplo de llamada:
 *   GET http://localhost:3000/
 */
app.get("/", async function (request, response) {
    r = {
        message: "Nothing to send",
    };
    response.json(r);
});

/**
 * @route   GET /serv001
 * @summary Recibe parámetros enviados como query string en la URL.
 * @param   {string} id    - Identificador del usuario.
 * @param   {string} token - Token de autenticación.
 * @param   {string} geo   - Coordenadas geográficas separadas por coma.
 * @returns {Object} JSON con los parámetros recibidos.
 *
 * Ejemplo de llamada:
 *   GET http://localhost:3000/serv001?id=Nope&token=2345678dhuj43567fgh&geo=123456789,1234567890
 */
app.get("/serv001", async function (req, res) {
    const user_id = req.query.id;
    const token = req.query.token;
    const geo = req.query.geo;

    r = {
        user_id: user_id,
        token: token,
        geo: geo,
    };

    res.json(r);
});

/**
 * @route   GET /serv0010
 * @summary Variante de /serv001; recibe los mismos parámetros via query string.
 *          Utiliza nombres de variable distintos para ilustrar la independencia
 *          de cada handler.
 * @param   {string} id    - Identificador del usuario.
 * @param   {string} token - Token de autenticación.
 * @param   {string} geo   - Coordenadas geográficas separadas por coma.
 * @returns {Object} JSON con los parámetros recibidos.
 *
 * Ejemplo de llamada:
 *   GET http://localhost:3000/serv0010?id=Nope&token=2345678dhuj43567fgh&geo=123456789,1234567890
 */
app.get("/serv0010", async function (req, res) {
    const user_id1 = req.query.id;
    const token1 = req.query.token;
    const geo1 = req.query.geo;

    r1 = {
        user_id: user_id1,
        token: token1,
        geo: geo1,
    };

    res.json(r1);
});

/**
 * @route   POST /serv002
 * @summary Recibe parámetros enviados en el cuerpo de la petición (JSON).
 * @param   {string} id    - Identificador del usuario.
 * @param   {string} token - Token de autenticación.
 * @param   {string} geo   - Coordenadas geográficas separadas por coma.
 * @returns {Object} JSON con los parámetros recibidos.
 *
 * Ejemplo de cuerpo (raw JSON):
 * {
 *   "id": "nope",
 *   "token": "ertydfg456Dfgwerty",
 *   "geo": "12345678,34567890"
 * }
 */
app.post("/serv002", async function (req, res) {
    const user_id = req.body.id;
    const token = req.body.token;
    const geo = req.body.geo;

    r = {
        user_id: user_id,
        token: token,
        geo: geo,
    };

    res.json(r);
});

/**
 * @route   POST /serv003/:info
 * @summary Recibe un parámetro como parte del segmento de la URL (path param).
 * @param   {string} info - Valor incluido directamente en la ruta.
 * @returns {Object} JSON con el valor del parámetro recibido.
 *
 * Ejemplo de llamada:
 *   POST http://localhost:3000/serv003/1234567
 */
app.post("/serv003/:info", async function (req, res) {
    const info = req.params.info;
    let r = { info: info };
    res.json(r);
});

/**
 * @route   POST /receipt/insert
 * @summary Inserta una o varias recetas en la colección "recipes" de MongoDB.
 *          Los datos de las recetas se reciben en el cuerpo de la petición
 *          como un arreglo JSON. Cada receta debe contener los campos:
 *            - name            {string}   Nombre de la receta.
 *            - ingredients     {string[]} Lista de ingredientes.
 *            - prepTimeInMinutes {number} Tiempo de preparación en minutos.
 *
 * @returns {Object} JSON indicando cuántos documentos se insertaron o el
 *                   mensaje de error en caso de fallo.
 *
 * Ejemplo de cuerpo (raw JSON):
 * [
 *   {
 *     "name": "elotes cocidos",
 *     "ingredients": ["corn", "mayonnaise", "cotija cheese", "sour cream", "lime"],
 *     "prepTimeInMinutes": 35
 *   },
 *   {
 *     "name": "guacamole",
 *     "ingredients": ["avocado", "lime", "salt", "cilantro", "onion", "tomato"],
 *     "prepTimeInMinutes": 10
 *   }
 * ]
 */
app.post("/receipt/insert", async function (req, res) {
    // Se reciben las recetas desde el cuerpo de la petición en lugar de
    // tenerlas definidas de forma estática dentro del handler.
    const recipes = req.body;

    // Validación básica: el cuerpo debe ser un arreglo con al menos un elemento.
    if (!Array.isArray(recipes) || recipes.length === 0) {
        return res.status(400).json({
            result: "El cuerpo de la petición debe ser un arreglo JSON con al menos una receta.",
        });
    }

    let result = "";

    try {
        const insertManyResult = await collection.insertMany(recipes);
        console.log(
            `${insertManyResult.insertedCount} documents successfully inserted.\n`,
        );
        result = `${insertManyResult.insertedCount} documents successfully inserted.`;
    } catch (err) {
        console.error(
            `Something went wrong trying to insert the new documents: ${err}\n`,
        );
        result = `Something went wrong trying to insert the new documents: ${err}`;
    }

    let r = { result: result };
    res.json(r);
});

// ---------------------------------------------------------------------------
// INICIO DEL SERVIDOR
// ---------------------------------------------------------------------------

/**
 * Inicia el servidor Express en el puerto 3000.
 * Una vez activo, establece la conexión con MongoDB y prepara las referencias
 * a la base de datos y la colección.
 */
app.listen(3000, function () {
    console.log("Aplicación ejemplo, escuchando el puerto 3000!");
    connectDB();
    prepareDB();
});

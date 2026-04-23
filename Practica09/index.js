/**
 * @file Practica07.js
 * @description Servidor REST con Express.js que demuestra distintos tipos de
 *              endpoints y operaciones CRUD con MongoDB.
 *              Maneja dos bases de datos:
 *                - myDatabase  → colección: recipes
 *                - proyectos   → colección: proyectos
 *
 * @requires express  - Framework para el servidor HTTP.
 * @requires mongodb  - Driver oficial de MongoDB para Node.js.
 * @requires uuid     - Generación de identificadores externos únicos (UUIDs).
 *
 * Instalación:
 *   npm install express mongodb uuid
 *
 * Ejecución:
 *   node Practica07.js
 *
 * Puerto: 3000
 *
 * ─── CONVENCIONES GENERALES ────────────────────────────────────────────────
 *  • id_externo : UUID v4 asignado automáticamente al insertar. Es el campo
 *                 que se usa en los endpoints para identificar un documento
 *                 (nunca se expone el _id interno de MongoDB en la API).
 *  • deleted    : Booleano. false = documento activo / true = borrado lógico.
 *                 Los endpoints de consulta solo devuelven deleted = false.
 * ───────────────────────────────────────────────────────────────────────────
 */

require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

var express = require("express");
var app = express();

const { MongoClient } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

/** @type {MongoClient} */
var client = 0;

// ── myDatabase ───────────────────────────────────────────────────────────────
var dbName = "";
var collectionName = "";
/** @type {import('mongodb').Db} */         var database = 0;
/** @type {import('mongodb').Collection} */ var collection = 0;

// ── proyectos ─────────────────────────────────────────────────────────────────
/** @type {import('mongodb').Db} */         var dbProyectos = 0;
/** @type {import('mongodb').Collection} */ var colProyectos = 0;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────────────────────
// CONEXIÓN Y CONFIGURACIÓN DE BD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @function prepareDB
 * @description Inicializa las referencias a ambas bases de datos y colecciones.
 *              MongoDB las crea automáticamente en la primera operación de
 *              escritura si todavía no existen.
 */
function prepareDB() {
    // myDatabase / recipes
    dbName = "myDatabase";
    collectionName = "recipes";
    database = client.db(dbName);
    collection = database.collection(collectionName);

    // proyectos / proyectos
    dbProyectos = client.db("proyectos");
    colProyectos = dbProyectos.collection("proyectos");
}

/**
 * @function connectDB
 * @async
 * @description Abre la conexión al clúster de MongoDB Atlas.
 */
async function connectDB() {
    const uri =
        "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";
    client = new MongoClient(uri);
    await client.connect();
}

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS GENERALES (sin BD)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   GET /
 * @summary Endpoint raíz de prueba.
 * @returns {Object} Mensaje informativo.
 */
app.get("/", async function (request, response) {
    response.json({ message: "Nothing to send" });
});

/**
 * @route   GET /serv001
 * @summary Recibe parámetros como query string.
 * @param   {string} id    - Identificador del usuario.
 * @param   {string} token - Token de autenticación.
 * @param   {string} geo   - Coordenadas separadas por coma.
 *
 * Ejemplo:
 *   GET http://localhost:3000/serv001?id=Nope&token=abc123&geo=19.43,-99.13
 */
app.get("/serv001", async function (req, res) {
    res.json({ user_id: req.query.id, token: req.query.token, geo: req.query.geo });
});

/**
 * @route   GET /serv0010
 * @summary Variante de /serv001.
 *
 * Ejemplo:
 *   GET http://localhost:3000/serv0010?id=Nope&token=abc123&geo=19.43,-99.13
 */
app.get("/serv0010", async function (req, res) {
    res.json({ user_id: req.query.id, token: req.query.token, geo: req.query.geo });
});

/**
 * @route   POST /serv002
 * @summary Recibe parámetros en el cuerpo JSON.
 *
 * Ejemplo de body:
 *   { "id": "nope", "token": "ertydfg456", "geo": "12345,67890" }
 */
app.post("/serv002", async function (req, res) {
    res.json({ user_id: req.body.id, token: req.body.token, geo: req.body.geo });
});

/**
 * @route   POST /serv003/:info
 * @summary Recibe un parámetro como path param.
 *
 * Ejemplo:
 *   POST http://localhost:3000/serv003/1234567
 */
app.post("/serv003/:info", async function (req, res) {
    res.json({ info: req.params.info });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS — RECIPES  (myDatabase)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /receipt/insert
 * @summary Inserta una o varias recetas. Genera id_externo (UUID) y establece
 *          deleted = false en cada documento automáticamente.
 *
 * Campos esperados por receta:
 *   - name              {string}   Nombre.
 *   - ingredients       {string[]} Ingredientes.
 *   - prepTimeInMinutes {number}   Tiempo de preparación en minutos.
 *   [id_externo y deleted se asignan automáticamente]
 *
 * Ejemplo de body:
 * [
 *   {
 *     "name": "elotes cocidos",
 *     "ingredients": ["corn","mayonnaise","cotija cheese","sour cream","lime"],
 *     "prepTimeInMinutes": 35
 *   }
 * ]
 */
app.post("/receipt/insert", async function (req, res) {
    const recipes = req.body;

    if (!Array.isArray(recipes) || recipes.length === 0) {
        return res.status(400).json({
            result: "El body debe ser un arreglo JSON con al menos una receta.",
        });
    }

    const recipesConCampos = recipes.map((r) => ({
        ...r,
        id_externo: uuidv4(),
        deleted: false,
    }));

    let result = "";
    try {
        const ins = await collection.insertMany(recipesConCampos);
        console.log(`${ins.insertedCount} recipes inserted.\n`);
        result = `${ins.insertedCount} recipes inserted successfully.`;
    } catch (err) {
        console.error(`Error inserting recipes: ${err}\n`);
        result = `Error inserting recipes: ${err}`;
    }
    res.json({ result });
});

// ─────────────────────────────────────────────────────────────────────────────
// ENDPOINTS — PROYECTOS  (proyectos DB)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   POST /proyectos/seed
 * @summary Inserta los 5 proyectos de ejemplo. Asigna id_externo y deleted
 *          automáticamente. Usar solo una vez para poblar la BD.
 *
 * Campos de cada proyecto:
 *   - nombre        {string}  Nombre del proyecto.
 *   - descripcion   {string}  Objetivo del proyecto.
 *   - responsable   {string}  Líder del proyecto.
 *   - fechaInicio   {string}  Fecha de inicio (YYYY-MM-DD).
 *   - fechaFin      {string}  Fecha estimada de entrega (YYYY-MM-DD).
 *   - presupuesto   {number}  Presupuesto en MXN.
 *   - estatus       {string}  Planeación | En progreso | Completado | Pausado.
 *   [id_externo y deleted se asignan automáticamente]
 *
 * Ejemplo:
 *   POST http://localhost:3000/proyectos/seed
 */
app.post("/proyectos/seed", async function (req, res) {
    const seed = [
        {
            nombre: "Portal de clientes",
            descripcion: "Portal web para que los clientes gestionen pedidos en línea.",
            responsable: "Ana García",
            fechaInicio: "2024-01-15",
            fechaFin: "2024-06-30",
            presupuesto: 150000,
            estatus: "Completado",
        },
        {
            nombre: "App móvil de inventario",
            descripcion: "Aplicación iOS/Android para control de inventario en tiempo real.",
            responsable: "Carlos Mendoza",
            fechaInicio: "2024-03-01",
            fechaFin: "2024-09-15",
            presupuesto: 220000,
            estatus: "En progreso",
        },
        {
            nombre: "Migración a la nube",
            descripcion: "Migración de servidores on-premise a AWS.",
            responsable: "Laura Ríos",
            fechaInicio: "2024-05-10",
            fechaFin: "2025-01-31",
            presupuesto: 500000,
            estatus: "En progreso",
        },
        {
            nombre: "Rediseño de identidad corporativa",
            descripcion: "Actualización de logotipo, paleta de colores y guía de marca.",
            responsable: "Roberto Vega",
            fechaInicio: "2024-02-20",
            fechaFin: "2024-04-30",
            presupuesto: 80000,
            estatus: "Completado",
        },
        {
            nombre: "Sistema de nómina automatizado",
            descripcion: "Automatización de nómina, IMSS y timbrado CFDI para 200 empleados.",
            responsable: "Patricia Solís",
            fechaInicio: "2024-07-01",
            fechaFin: "2025-03-31",
            presupuesto: 310000,
            estatus: "Planeación",
        },
    ];

    const seedConCampos = seed.map((p) => ({
        ...p,
        id_externo: uuidv4(),
        deleted: false,
    }));

    let result = "";
    try {
        const ins = await colProyectos.insertMany(seedConCampos);
        console.log(`${ins.insertedCount} proyectos insertados.\n`);
        result = `${ins.insertedCount} proyectos insertados exitosamente.`;
    } catch (err) {
        console.error(`Error al insertar proyectos: ${err}\n`);
        result = `Error al insertar proyectos: ${err}`;
    }
    res.json({ result });
});

/**
 * @route   GET /proyectos
 * @summary Devuelve todos los proyectos activos (deleted = false).
 * @returns {Object[]} Arreglo de proyectos.
 *
 * Ejemplo:
 *   GET http://localhost:3000/proyectos
 */
app.get("/proyectos", async function (req, res) {
    try {
        const proyectos = await colProyectos.find({ deleted: false }).toArray();
        res.json(proyectos);
    } catch (err) {
        console.error(`Error al obtener proyectos: ${err}\n`);
        res.status(500).json({ error: `Error al obtener proyectos: ${err}` });
    }
});

/**
 * @route   POST /proyectos/insert
 * @summary Inserta uno o varios proyectos recibidos en el body.
 *          Asigna id_externo y deleted automáticamente.
 *
 * Ejemplo de body:
 * [
 *   {
 *     "nombre": "Nuevo proyecto",
 *     "descripcion": "Descripción",
 *     "responsable": "Juan López",
 *     "fechaInicio": "2025-01-01",
 *     "fechaFin": "2025-12-31",
 *     "presupuesto": 100000,
 *     "estatus": "Planeación"
 *   }
 * ]
 */
app.post("/proyectos/insert", async function (req, res) {
    const proyectos = req.body;

    if (!Array.isArray(proyectos) || proyectos.length === 0) {
        return res.status(400).json({
            result: "El body debe ser un arreglo JSON con al menos un proyecto.",
        });
    }

    const proyectosConCampos = proyectos.map((p) => ({
        ...p,
        id_externo: uuidv4(),
        deleted: false,
    }));

    let result = "";
    try {
        const ins = await colProyectos.insertMany(proyectosConCampos);
        console.log(`${ins.insertedCount} proyectos insertados.\n`);
        result = `${ins.insertedCount} proyectos insertados exitosamente.`;
    } catch (err) {
        console.error(`Error al insertar proyectos: ${err}\n`);
        result = `Error al insertar proyectos: ${err}`;
    }
    res.json({ result });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD — DELETE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   DELETE /proyectos/deleteOne/fisico/:id_externo
 * @summary DELETE FÍSICO — Elimina permanentemente el documento cuyo
 *          id_externo coincida con el parámetro de la URL.
 *          ⚠ Esta acción es irreversible; el documento desaparece de la BD.
 *
 * @param   {string} id_externo - UUID del proyecto a eliminar.
 * @returns {Object} Resultado de la operación.
 *
 * Ejemplo:
 *   DELETE http://localhost:3000/proyectos/deleteOne/fisico/<id_externo>
 */
app.delete("/proyectos/deleteOne/fisico/:id_externo", async function (req, res) {
    const { id_externo } = req.params;

    let result = "";
    try {
        const del = await colProyectos.deleteOne({ id_externo });

        if (del.deletedCount === 0) {
            return res.status(404).json({
                result: `No se encontró ningún proyecto con id_externo: ${id_externo}`,
            });
        }

        console.log(`Proyecto ${id_externo} eliminado físicamente.\n`);
        result = `Proyecto ${id_externo} eliminado físicamente de la base de datos.`;
    } catch (err) {
        console.error(`Error en delete físico: ${err}\n`);
        result = `Error en delete físico: ${err}`;
    }
    res.json({ result });
});

/**
 * @route   DELETE /proyectos/deleteOne/logico/:id_externo
 * @summary DELETE LÓGICO — Marca deleted = true en el documento cuyo
 *          id_externo coincida. El documento permanece en la BD pero queda
 *          excluido de las consultas normales (GET /proyectos filtra
 *          deleted = false). Permite auditoría y recuperación posterior.
 *
 * @param   {string} id_externo - UUID del proyecto a marcar como eliminado.
 * @returns {Object} Resultado de la operación.
 *
 * Ejemplo:
 *   DELETE http://localhost:3000/proyectos/deleteOne/logico/<id_externo>
 */
app.delete("/proyectos/deleteOne/logico/:id_externo", async function (req, res) {
    const { id_externo } = req.params;

    let result = "";
    try {
        const upd = await colProyectos.updateOne(
            { id_externo, deleted: false },
            { $set: { deleted: true } }
        );

        if (upd.matchedCount === 0) {
            return res.status(404).json({
                result: `No se encontró proyecto activo con id_externo: ${id_externo}`,
            });
        }

        console.log(`Proyecto ${id_externo} marcado como eliminado lógicamente.\n`);
        result = `Proyecto ${id_externo} marcado como eliminado lógicamente (deleted = true).`;
    } catch (err) {
        console.error(`Error en delete lógico: ${err}\n`);
        result = `Error en delete lógico: ${err}`;
    }
    res.json({ result });
});

// ─────────────────────────────────────────────────────────────────────────────
// CRUD — UPDATE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route   PUT /proyectos/updateOne/:id_externo
 * @summary Actualiza parcialmente los campos del documento cuyo id_externo
 *          coincida. Solo modifica los campos enviados en el body ($set parcial),
 *          el resto permanece sin cambios.
 *          Solo afecta documentos activos (deleted = false).
 *          Los campos _id, id_externo y deleted no pueden modificarse desde
 *          este endpoint (se eliminan del body automáticamente).
 *
 * @param   {string} id_externo - UUID del proyecto a actualizar.
 * @body    Cualquier subconjunto de campos del proyecto:
 *            nombre, descripcion, responsable, fechaInicio,
 *            fechaFin, presupuesto, estatus.
 * @returns {Object} Resultado de la operación.
 *
 * Ejemplo:
 *   PUT http://localhost:3000/proyectos/updateOne/<id_externo>
 *   Body:
 *   {
 *     "estatus": "Completado",
 *     "presupuesto": 175000
 *   }
 */
app.put("/proyectos/updateOne/:id_externo", async function (req, res) {
    const { id_externo } = req.params;
    const cambios = req.body;

    // Proteger campos de control: no se pueden cambiar desde el body
    delete cambios._id;
    delete cambios.id_externo;
    delete cambios.deleted;

    if (!cambios || Object.keys(cambios).length === 0) {
        return res.status(400).json({
            result: "El body debe contener al menos un campo a actualizar.",
        });
    }

    let result = "";
    try {
        const upd = await colProyectos.updateOne(
            { id_externo, deleted: false },
            { $set: cambios }
        );

        if (upd.matchedCount === 0) {
            return res.status(404).json({
                result: `No se encontró proyecto activo con id_externo: ${id_externo}`,
            });
        }

        console.log(`Proyecto ${id_externo} actualizado. modifiedCount: ${upd.modifiedCount}.\n`);
        result = upd.modifiedCount > 0
            ? `Proyecto ${id_externo} actualizado exitosamente.`
            : `Proyecto ${id_externo} encontrado pero sin cambios (los valores ya eran iguales).`;
    } catch (err) {
        console.error(`Error en updateOne: ${err}\n`);
        result = `Error en updateOne: ${err}`;
    }
    res.json({ result });
});

// ─────────────────────────────────────────────────────────────────────────────
// INICIO DEL SERVIDOR
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inicia Express en el puerto 3000, conecta a MongoDB y prepara las
 * referencias a ambas bases de datos y sus colecciones.
 */
app.listen(3000, function () {
    console.log("Aplicación ejemplo, escuchando el puerto 3000!");
    connectDB();
    prepareDB();
});
var express = require('express');
var crypto = require('crypto'); // Importamos la librería nativa para encriptación
var app = express(); // Contenedor de Endpoints o WS Restful

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Endpoint Raíz ---
app.get("/", async function (request, response) {
    var r = {
        'message': 'Nothing to send'
    };
    response.json(r);
});

// --- Endpoint Original ECHO ---
app.post("/echo", async function (req, res) {
    const cid = req.body.id;
    const clat = req.body.lat.toString();
    const clong = req.body.long.toString();

    const lat_parts = clat.split('.');
    const long_parts = clong.split('.');

    var r = {
        'id_e': cid,
        'lat_e': clat,
        'long_e': clong,
        'lat_i_e': lat_parts[0],
        'lat_d_e': lat_parts[1],
        'long_i_e': long_parts[0],
        'long_d_e': long_parts[1]
    };
    res.json(r);
});

// ---------------- NUEVOS ENDPOINTS SOLICITADOS ----------------

// i. mascaracteres: regresa la cadena más larga. Si iguales, la primera.
// Payload: { "str1": "hola", "str2": "mundo" }
app.post("/mascaracteres", function (req, res) {
    const s1 = req.body.str1 || "";
    const s2 = req.body.str2 || "";

    // Si s1 es mayor o igual a s2, regresa s1
    const resultado = (s1.length >= s2.length) ? s1 : s2;

    res.json({ resultado: resultado });
});

// ii. menoscaracteres: regresa la cadena más corta. Si iguales, la primera.
// Payload: { "str1": "hola", "str2": "mundo" }
app.post("/menoscaracteres", function (req, res) {
    const s1 = req.body.str1 || "";
    const s2 = req.body.str2 || "";

    // Si s1 es menor o igual a s2, regresa s1
    const resultado = (s1.length <= s2.length) ? s1 : s2;

    res.json({ resultado: resultado });
});

// iii. numcaracteres: regresa el número de caracteres
// Payload: { "str": "hola mundo" }
app.post("/numcaracteres", function (req, res) {
    const s = req.body.str || "";

    res.json({ longitud: s.length });
});

// iv. palindroma: regresa true si es palíndroma
// Payload: { "str": "anita lava la tina" }
app.post("/palindroma", function (req, res) {
    const s = req.body.str || "";

    // Normalizamos: quitamos espacios y pasamos a minúsculas para comparar correctamente
    // Ejemplo: "Anita lava la tina" -> "anitalavalatina"
    const limpio = s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const reverso = limpio.split('').reverse().join('');

    const esPalindroma = (limpio === reverso);

    res.json({ es_palindroma: esPalindroma });
});

// v. concat: concatena dos cadenas iniciando con la primera
// Payload: { "str1": "Hola ", "str2": "Mundo" }
app.post("/concat", function (req, res) {
    const s1 = req.body.str1 || "";
    const s2 = req.body.str2 || "";

    res.json({ resultado: s1 + s2 });
});

// vi. applysha256: aplica SHA256 y regresa original y encriptada
// Payload: { "str": "patito" }
app.post("/applysha256", function (req, res) {
    const s = req.body.str || "";

    // Crear hash SHA256
    const hash = crypto.createHash('sha256').update(s).digest('hex');

    res.json({
        original: s,
        encriptada: hash
    });
});

// vii. verifysha256: compara cadena normal (encriptada al vuelo) contra una encriptada
// Payload: { "str": "patito", "hash": "el_hash_sha256_aqui..." }
app.post("/verifysha256", function (req, res) {
    const textoNormal = req.body.str || "";
    const hashRecibido = req.body.hash || "";

    // Calculamos el hash del texto normal
    const hashCalculado = crypto.createHash('sha256').update(textoNormal).digest('hex');

    // Comparamos
    const coinciden = (hashCalculado === hashRecibido);

    res.json({ coincide: coinciden });
});

app.listen(3000, function () {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});
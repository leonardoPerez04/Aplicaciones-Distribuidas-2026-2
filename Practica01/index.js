var express = require('express');
var app = express(); // Contenedor de Endpoints o WS Restful

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint GET: Devuelve un mensaje y un número aleatorio
app.get("/", async function (request, response) {
    // Generar número aleatorio entero entre 1 y 100
    var randomNum = Math.floor(Math.random() * 100) + 1;

    r = {
        'message': 'Respuesta con aleatorio',
        'random_value': randomNum
    };

    response.json(r);
});

// Endpoint POST: Recibe datos, los devuelve y agrega un número aleatorio extra
app.post("/echo", async function (req, res) {

    // Generar número aleatorio también aquí
    var randomNum = Math.floor(Math.random() * 100) + 1;

    r = {
        'server_random': randomNum // Nuevo campo con el valor aleatorio
    };

    res.json(r);
});

app.listen(3000, function () {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});
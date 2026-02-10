var express = require('express');
var app = express(); //Contenedor de Endpoints o WS Restful

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", async function (request, response) {
    r = {
        'message': 'Nothing to send'
    };
    response.json(r);
});

// Call this service sending payload in body: raw - json
/*
{
    "id": "pt001",
    "lat": "99.1234567898765",
    "long": "-19.4567654566543"
}
*/
app.post("/echo", async function (req, res) {
    const cid = req.body.id;
    // Forzamos a string (.toString()) por si el usuario envía números puros en el JSON
    const clat = req.body.lat.toString();
    const clong = req.body.long.toString();

    // Lógica de fragmentación:
    // split('.') divide el texto en un arreglo: la posición [0] es el entero, la [1] es el decimal
    const lat_parts = clat.split('.');
    const long_parts = clong.split('.');

    r = {
        'id_e': cid,
        'lat_e': clat,
        'long_e': clong,

        // Asignamos las partes fragmentadas de LATITUD
        'lat_i_e': lat_parts[0], // Parte Entera
        'lat_d_e': lat_parts[1], // Parte Decimal

        // Asignamos las partes fragmentadas de LONGITUD
        'long_i_e': long_parts[0], // Parte Entera
        'long_d_e': long_parts[1]  // Parte Decimal
    };

    res.json(r);
});

app.listen(3000, function () {
    console.log('Aplicación ejemplo, escuchando el puerto 3000!');
});

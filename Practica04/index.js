var express = require('express');
var app = express();

// Middleware para parsear JSON y URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variable en memoria para el Ejercicio 3 (Gestor de Tareas)
let tareas = [];

// --- Endpoint Raíz ---
app.get("/", function (req, res) {
    res.json({ estado: "exito", mensaje: "Servidor funcionando correctamente" });
});

// ==========================================
// Ejercicio 1: Servicio de Saludo Básico
// ==========================================
app.post("/saludo", function (req, res) {
    try {
        const { nombre } = req.body;

        if (!nombre || typeof nombre !== 'string' || nombre.trim() === "") {
            throw new Error("El campo 'nombre' es obligatorio y debe ser texto.");
        }

        res.json({
            estado: "exito",
            mensaje: `Hola, ${nombre}`
        });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 2: Calculadora de Operaciones Básicas
// ==========================================
app.post("/calcular", function (req, res) {
    try {
        // Parseamos a float para asegurar que son números
        const a = parseFloat(req.body.a);
        const b = parseFloat(req.body.b);
        const operacion = req.body.operacion;

        if (isNaN(a) || isNaN(b)) {
            throw new Error("Los campos 'a' y 'b' deben ser números válidos.");
        }

        let resultado = 0;

        switch (operacion) {
            case 'suma':
                resultado = a + b;
                break;
            case 'resta':
                resultado = a - b;
                break;
            case 'multiplicacion':
                resultado = a * b;
                break;
            case 'division':
                if (b === 0) throw new Error("No se puede dividir por cero.");
                resultado = a / b;
                break;
            default:
                throw new Error("Operación no válida. Use: suma, resta, multiplicacion, division.");
        }

        res.json({
            estado: "exito",
            resultado: resultado
        });

    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 3: Gestor de Tareas (CRUD Básico)
// ==========================================

// 3.1 Crear tarea
app.post("/tareas", function (req, res) {
    try {
        const { id, titulo, completada } = req.body;

        if (!id || !titulo) {
            throw new Error("ID y Título son obligatorios.");
        }

        // Verificar si el ID ya existe
        const existe = tareas.find(t => t.id === id);
        if (existe) throw new Error("El ID de la tarea ya existe.");

        const nuevaTarea = {
            id: parseInt(id),
            titulo: titulo,
            completada: completada === true // Asegurar booleano
        };

        tareas.push(nuevaTarea);

        res.json({ estado: "exito", mensaje: "Tarea creada", tarea: nuevaTarea });
    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// 3.2 Listar tareas
app.get("/tareas", function (req, res) {
    try {
        res.json({ estado: "exito", total: tareas.length, tareas: tareas });
    } catch (error) {
        res.status(500).json({ estado: "error", mensaje: error.message });
    }
});

// 3.3 Actualizar tarea
app.put("/tareas/:id", function (req, res) {
    try {
        const idParam = parseInt(req.params.id);
        const { titulo, completada } = req.body;

        const indice = tareas.findIndex(t => t.id === idParam);

        if (indice === -1) {
            throw new Error("Tarea no encontrada.");
        }

        // Actualizamos solo si vienen los campos, si no, dejamos el anterior
        if (titulo !== undefined) tareas[indice].titulo = titulo;
        if (completada !== undefined) tareas[indice].completada = completada;

        res.json({ estado: "exito", mensaje: "Tarea actualizada", tarea: tareas[indice] });
    } catch (error) {
        res.status(404).json({ estado: "error", mensaje: error.message });
    }
});

// 3.4 Eliminar tarea
app.delete("/tareas/:id", function (req, res) {
    try {
        const idParam = parseInt(req.params.id);
        const indice = tareas.findIndex(t => t.id === idParam);

        if (indice === -1) {
            throw new Error("Tarea no encontrada para eliminar.");
        }

        // Eliminar del array
        const tareaEliminada = tareas.splice(indice, 1);

        res.json({ estado: "exito", mensaje: "Tarea eliminada", tarea: tareaEliminada[0] });
    } catch (error) {
        res.status(404).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 4: Validador de Contraseñas
// ==========================================
app.post("/validar-password", function (req, res) {
    try {
        const pwd = req.body.password || "";
        let errores = [];

        // Validaciones
        if (pwd.length < 8) errores.push("Debe tener al menos 8 caracteres.");
        if (!/[A-Z]/.test(pwd)) errores.push("Debe tener al menos una letra mayúscula.");
        if (!/[a-z]/.test(pwd)) errores.push("Debe tener al menos una letra minúscula.");
        if (!/[0-9]/.test(pwd)) errores.push("Debe tener al menos un número.");

        const esValida = (errores.length === 0);

        res.json({
            estado: "exito", // El proceso de validación fue exitoso, aunque la pass sea inválida
            esValida: esValida,
            errores: errores
        });

    } catch (error) {
        res.status(500).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 5: Conversor de Temperatura
// ==========================================
app.post("/convertir-temperatura", function (req, res) {
    try {
        const valor = parseFloat(req.body.valor);
        const desde = (req.body.desde || "").toUpperCase();
        const hacia = (req.body.hacia || "").toUpperCase();

        if (isNaN(valor)) throw new Error("El 'valor' debe ser numérico.");
        const escalasValidas = ["C", "F", "K"];
        if (!escalasValidas.includes(desde) || !escalasValidas.includes(hacia)) {
            throw new Error("Las escalas deben ser C, F o K.");
        }

        let resultado = valor;

        // Estrategia: Convertir todo a Celsius primero, luego al destino
        let valorEnCelsius = 0;

        // 1. Convertir origen a Celsius
        if (desde === "C") valorEnCelsius = valor;
        else if (desde === "F") valorEnCelsius = (valor - 32) * (5 / 9);
        else if (desde === "K") valorEnCelsius = valor - 273.15;

        // 2. Convertir Celsius a destino
        if (hacia === "C") resultado = valorEnCelsius;
        else if (hacia === "F") resultado = (valorEnCelsius * 9 / 5) + 32;
        else if (hacia === "K") resultado = valorEnCelsius + 273.15;

        // Redondear a 2 decimales para limpieza
        resultado = Math.round(resultado * 100) / 100;

        res.json({
            estado: "exito",
            valorOriginal: valor,
            valorConvertido: resultado,
            escalaOriginal: desde,
            escalaConvertida: hacia
        });

    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 6: Buscador en Array
// ==========================================
app.post("/buscar", function (req, res) {
    try {
        const array = req.body.array;
        const elemento = req.body.elemento;

        if (!Array.isArray(array)) {
            throw new Error("El campo 'array' debe ser un arreglo.");
        }

        const indice = array.indexOf(elemento);
        const encontrado = (indice !== -1);
        const tipo = typeof elemento;

        res.json({
            estado: "exito",
            encontrado: encontrado,
            indice: indice,
            tipoElemento: tipo
        });

    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// ==========================================
// Ejercicio 7: Contador de Palabras
// ==========================================
app.post("/contar-palabras", function (req, res) {
    try {
        const texto = req.body.texto;

        if (typeof texto !== 'string') {
            throw new Error("Se requiere un campo 'texto' de tipo string.");
        }

        // Si el texto está vacío
        if (texto.trim().length === 0) {
            return res.json({
                estado: "exito",
                totalPalabras: 0,
                totalCaracteres: 0,
                palabrasUnicas: 0
            });
        }

        const totalCaracteres = texto.length;

        // Dividir por espacios, saltos de línea o tabuladores y filtrar vacíos
        const palabras = texto.trim().split(/\s+/);
        const totalPalabras = palabras.length;

        // Calcular únicas usando un Set (normalizamos a minúsculas para evitar duplicados como Hola/hola)
        const unicas = new Set(palabras.map(p => p.toLowerCase()));

        res.json({
            estado: "exito",
            totalPalabras: totalPalabras,
            totalCaracteres: totalCaracteres,
            palabrasUnicas: unicas.size
        });

    } catch (error) {
        res.status(400).json({ estado: "error", mensaje: error.message });
    }
});

// Iniciar servidor
app.listen(3000, function () {
    console.log('Servidor protegido iniciado en puerto 3000 con los 7 ejercicios!');
});
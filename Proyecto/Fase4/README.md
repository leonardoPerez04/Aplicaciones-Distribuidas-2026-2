# Autenticación 2FA con Telegram

Sistema de autenticación de dos factores usando Telegram como canal de envío de códigos PIN.

## 🚀 Características

- **Autenticación tradicional**: Usuario y contraseña con hashing SHA256
- **2FA por Telegram**: Códigos PIN de 4 dígitos enviados automáticamente a Telegram
- **Expiración de PIN**: Los códigos expiran a los 3 minutos
- **Token de sesión**: Generación de tokens seguros tras autenticación exitosa
- **Base de datos MongoDB**: Almacenamiento seguro de credenciales y datos de usuario
- **Interfaz amigable**: UI moderna con flujo intuitivo de dos pasos

## 📋 Requisitos previos

- Node.js 14+ instalado
- MongoDB Atlas cuenta activa
- Bot de Telegram creado (ver sección de configuración)
- Variables de entorno configuradas

## 🔧 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd tu-proyecto
```

### 2. Instalar dependencias

```bash
npm install
```

Las dependencias requeridas son:
- `express`: Framework web
- `mongodb`: Driver de MongoDB
- `node-telegram-bot-api`: Librería para interactuar con Telegram Bot API
- `dotenv`: Gestión de variables de entorno

### 3. Crear archivo `.env`

En la raíz del proyecto, crear un archivo `.env` con el siguiente contenido:

```env
# Configuración de Telegram Bot
TELEGRAM_BOT_TOKEN=TU_TOKEN_DE_TELEGRAM_AQUI

# Configuración de MongoDB
MONGODB_URI=mongodb+srv://usuario:contraseña@cluster.mongodb.net/?appName=Cluster0

# Puerto del servidor
PORT=3000

# Ambiente
NODE_ENV=development
```

## 🤖 Configuración de Bot de Telegram

### Paso 1: Crear un nuevo bot

1. Abre Telegram y busca a `@BotFather`
2. Envía `/start`
3. Envía `/newbot`
4. Sigue las instrucciones para nombrar tu bot
5. **BotFather te proporcionará un token** - Cópialo y guárdalo en `.env`

### Paso 2: Obtener tu Chat ID

1. Busca tu bot en Telegram y presiona `/start`
2. Envía un mensaje cualquiera
3. Abre en el navegador: `https://api.telegram.org/botTU_TOKEN/getUpdates`
4. Busca el `chat.id` en la respuesta JSON
5. Este ID debe estar en la BD en la colección `telegram`

## 📊 Estructura de Base de Datos

### Base de datos: `Usuarios`

#### Colección: `usuarios`
```json
{
  "_id": ObjectId,
  "username": "leonardo_perez"
}
```

#### Colección: `password`
```json
{
  "_id": ObjectId,
  "username": "leonardo_perez",
  "hash": "sha256_hash_aqui"
}
```

#### Colección: `correo`
```json
{
  "_id": ObjectId,
  "username": "leonardo_perez",
  "correo": "leonardo.perez@ejemplo.com"
}
```

#### Colección: `telefono`
```json
{
  "_id": ObjectId,
  "username": "leonardo_perez",
  "telefono": "5512345678"
}
```

#### Colección: `telegram`
```json
{
  "_id": ObjectId,
  "username": "leonardo_perez",
  "chatId": "123456789"
}
```

### Base de datos: `pines`

#### Colección: `pines_activos`
```json
{
  "_id": ObjectId,
  "usuario": "leonardo_perez",
  "pin": "1234",
  "creado": ISODate("2024-01-01T12:00:00Z"),
  "expira": ISODate("2024-01-01T12:03:00Z"),
  "verificado": false
}
```

## 🗄️ Inicializar la Base de Datos

```bash
node init-db.js
```

Este comando:
- Crea las colecciones necesarias
- Inserta 5 usuarios de ejemplo con datos de prueba
- Limpia datos anteriores para evitar duplicados

**Usuarios de prueba:**

| Usuario | Contraseña | Email | Teléfono | Chat ID |
|---------|-----------|-------|----------|---------|
| leonardo_perez | telematica2026 | leonardo.perez@ejemplo.com | 5512345678 | 111111111 |
| admin_control | password123 | admin.control@ejemplo.com | 5523456789 | 222222222 |
| sensor_hub | iot_secure_pass | sensor.hub@ejemplo.com | 5534567890 | 333333333 |
| test_user | abc12345 | test.user@ejemplo.com | 5545678901 | 444444444 |
| root_dev | root_access_77 | root.dev@ejemplo.com | 5556789012 | 555555555 |

## 🎯 Iniciar el servidor

```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

## 📡 API Endpoints

### 1. POST `/api/login`

Autentica al usuario con credenciales y genera un PIN de 2FA.

**Request:**
```json
{
  "username": "leonardo_perez",
  "password": "telematica2026"
}
```

**Response (exitoso):**
```json
{
  "status": 1,
  "resultado": 1,
  "msg": "PIN generado. Revisa tu Telegram.",
  "sessionId": "leonardo_perez",
  "expira": "2024-01-01T12:03:00Z"
}
```

**Response (error):**
```json
{
  "status": 0,
  "resultado": 0,
  "msg": "Contraseña incorrecta"
}
```

### 2. POST `/api/verify-pin`

Verifica el PIN ingresado por el usuario.

**Request:**
```json
{
  "username": "leonardo_perez",
  "pin": "1234"
}
```

**Response (exitoso):**
```json
{
  "status": 1,
  "resultado": 1,
  "msg": "Autenticación 2FA exitosa",
  "sessionToken": "abc123def456...",
  "usuario": "leonardo_perez"
}
```

**Response (error):**
```json
{
  "status": 0,
  "resultado": 0,
  "msg": "PIN expirado"
}
```

### 3. GET `/api/user-info/:username`

Obtiene información de contacto del usuario.

**Response:**
```json
{
  "status": 1,
  "usuario": "leonardo_perez",
  "correo": "leonardo.perez@ejemplo.com",
  "telefono": "5512345678"
}
```

## 🔄 Flujo de Autenticación

```
┌─────────────────────────────────────────────────────────┐
│ 1. Usuario accede a http://localhost:3000               │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 2. Ingresa usuario y contraseña en el formulario        │
│    - Validación en cliente                              │
│    - Envío a POST /api/login                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Servidor verifica credenciales en MongoDB            │
│    - Hash SHA256 de la contraseña                       │
│    - Comparación con BD                                 │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Si es correcto:                                      │
│    - Generar PIN de 4 dígitos                           │
│    - Calcular expiración (3 minutos)                    │
│    - Guardar en BD                                      │
│    - ENVIAR VÍA TELEGRAM al usuario                     │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 5. Frontend muestra pantalla 2FA                        │
│    - Campo de entrada para el PIN                       │
│    - Temporizador de expiración                         │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 6. Usuario ingresa PIN y envía a POST /api/verify-pin   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 7. Servidor verifica:                                   │
│    - PIN no expirado                                    │
│    - PIN coincide con el almacenado                     │
│    - Marcar PIN como verificado                         │
│    - Generar token de sesión                            │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ 8. Autenticación exitosa ✓                              │
│    - Token de sesión generado                           │
│    - Usuario autenticado                                │
└─────────────────────────────────────────────────────────┘
```

## ⚙️ Configuración Avanzada

### Cambiar duración del PIN

En `server.js`, línea 83:
```javascript
const tiempoFinaliza = new Date(tiempoCreacion.getTime() + 3 * 60000); // Cambiar 3 por minutos deseados
```

### Cambiar longitud del PIN

En `server.js`, línea 79:
```javascript
let pinValue = Math.trunc(Math.random() * 10000).toString().padStart(4, '0');
// Cambiar 10000 y 4 según sea necesario
```

### Ejecutar sin Token de Telegram (solo consola)

Si no tienes token configurado, el sistema funcionará normalmente pero mostrará los PINs en la consola del servidor en lugar de enviarlos por Telegram.

## 📝 Logs y Debugging

El servidor proporciona logs útiles:

```
✓ Bot de Telegram inicializado
✓ Conexión establecida con MongoDB Atlas
✓ PIN enviado a Telegram para usuario: leonardo_perez
```

Si hay errores:
```
⚠ Token de Telegram no configurado
⚠ Error al enviar PIN por Telegram: ...
```

## 🛡️ Consideraciones de Seguridad

1. **Contraseñas**: Almacenadas como hash SHA256 (considerar bcrypt para producción)
2. **Tokens de sesión**: Generados con `crypto.randomBytes(32)`
3. **Variables de entorno**: Token de Telegram nunca se hardcodea
4. **Expiración de PIN**: Válido solo 3 minutos
5. **HTTPS**: Usar en producción (no HTTP)
6. **Chat IDs de Telegram**: Personalizar con IDs reales de los usuarios

## 🐛 Solución de Problemas

### "Token de Telegram no configurado"
- Verifica que `.env` existe y tiene `TELEGRAM_BOT_TOKEN`
- No debe estar vacío o con valor `YOUR_TELEGRAM_BOT_TOKEN_HERE`

### "Error de conexión a MongoDB"
- Verifica la URI en `.env`
- Comprueba que tu IP está en la whitelist de MongoDB Atlas
- Verifica que la contraseña es correcta

### PIN no se recibe en Telegram
- Verifica que el `chatId` en la BD es correcto
- Comprueba los logs del servidor
- Asegúrate de que el bot tiene permisos de envío de mensajes

### PIN no valida correctamente
- El PIN es sensible a mayúsculas/minúsculas
- Verifica que no ha expirado (3 minutos)
- Comprueba que es exactamente 4 dígitos

## 📚 Estructura del Proyecto

```
Proyecto/
├── server.js              # Servidor Express principal
├── init-db.js             # Script de inicialización de BD
├── package.json           # Dependencias
├── .env                   # Variables de entorno
├── .gitignore             # Archivos a ignorar en Git
├── README.md              # Este archivo
└── public/
    └── index.html         # Frontend 2FA
```

## 👤 Usuarios de Ejemplo

Después de ejecutar `init-db.js`, puedes probar con:

```
Usuario: leonardo_perez
Contraseña: telematica2026
Chat ID Telegram: 111111111
```

## 📞 Soporte

Para problemas o preguntas, revisa:
- Los logs en la consola del servidor
- La respuesta JSON del API
- MongoDB Atlas para verificar datos almacenados

## 📄 Licencia

ISC

---

**Nota**: Este sistema es para demostración educativa. Para producción, implementar:
- Bcrypt para hashing de contraseñas
- HTTPS obligatorio
- Rate limiting
- Validación adicional de entrada
- Logging robusto

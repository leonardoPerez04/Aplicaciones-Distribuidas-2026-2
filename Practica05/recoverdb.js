require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);
const { MongoClient } = require('mongodb');

async function listDatabases(client) {
  // Añadimos 'const' para evitar que sea una variable global
  const databasesList = await client.db().admin().listDatabases();

  console.log("Bases de datos disponibles:");
  databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}

async function main() {
  // 1. Definimos las credenciales por separado
  const usuario = encodeURIComponent("leonardopl617_db_user");
  const password = encodeURIComponent("IyjYnNmI9zhv7KE2");

  // 2. Construimos la URI usando Template Literals
  const uri = `mongodb+srv://${usuario}:${password}@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0`;

  // 3. Creamos el cliente (useUnifiedTopology ya no es obligatorio en versiones nuevas, pero puedes dejarlo)
  const client = new MongoClient(uri);

  try {
    console.log("Intentando conectar a MongoDB Atlas...");
    await client.connect();
    console.log("¡Conexión exitosa!");

    await listDatabases(client);

  } catch (e) {
    console.error("Error detectado:", e.message);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
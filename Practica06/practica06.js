require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const MongoClient = require('mongodb').MongoClient;

async function listDatabases(client) {
    const databasesList = await client.db().admin().listDatabases();

    console.log("Databases:");
    databasesList.databases.forEach(db => console.log(` - ${db.name}`));
}

async function findAllData(client) {
    // Apuntamos a la base de datos sample_mflix
    const db = client.db("sample_mflix");

    // 1. Consultar primeros 5 documentos de la colección 'comments'
    console.log("\n=============================================");
    console.log("Primeros 5 comentarios (comments):");
    console.log("=============================================\n");
    const commentsCursor = await db.collection("comments").find({}).limit(5);
    const commentsResults = await commentsCursor.toArray();
    console.log(JSON.stringify(commentsResults, null, 2));

    // 2. Consultar primeros 5 documentos de la colección 'embedded_movies'
    console.log("\n=============================================");
    console.log("Primeras 5 películas incrustadas (embedded_movies):");
    console.log("=============================================\n");
    const embeddedMoviesCursor = await db.collection("embedded_movies").find({}).limit(5);
    const embeddedMoviesResults = await embeddedMoviesCursor.toArray();
    console.log(JSON.stringify(embeddedMoviesResults, null, 2));
}

async function main() {
    const uri = "mongodb+srv://leonardopl617_db_user:IyjYnNmI9zhv7KE2@cluster0.nw6q2ik.mongodb.net/?appName=Cluster0";

    // Ya no incluimos el objeto de opciones para evitar el MongoParseError
    const client = new MongoClient(uri);

    try {
        // Conectar al clúster de MongoDB
        await client.connect();

        // Llamadas a la base de datos
        await listDatabases(client);
        await findAllData(client);

    } catch (e) {
        console.error("Ocurrió un error:", e);
    } finally {
        await client.close();
    }
}

main().catch(console.error);
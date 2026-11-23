import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME;
let db = null;


/**
 * Establece la conexión con MongoDB y reutiliza la instancia activa.
 * @returns {Promise<import('mongodb').Db>} Instancia de la base de datos conectada.
 * @throws {Error} Si falla la conexión de red o la autenticación con MongoDB.
 */
export async function connectDB() {
    if (db) return db;
    try {
        const client = new MongoClient(uri);
        await client.connect();
        db = client.db(dbName);
        return db;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}
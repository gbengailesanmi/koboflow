"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
const mongodb_1 = require("mongodb");
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGO_DB_NAME;
if (!uri) {
    throw new Error('Missing MONGODB_URI');
}
// Use globalThis to cache the MongoClient across module reloads / serverless invocations
// This makes connection reuse safe in serverless environments (Vercel, AWS Lambda, etc.).
let cachedClient = globalThis.__mongoClient;
let cachedClientPromise = globalThis.__mongoClientPromise;
let indexesCreated = false;
async function ensureIndexes(db) {
    if (indexesCreated)
        return;
    try {
        await db.collection('settings').createIndex({ customerId: 1 }, { unique: true });
        await db.collection('settings').createIndex({ updatedAt: -1 });
        indexesCreated = true;
    }
    catch (error) {
        console.error('Error creating indexes:', error);
    }
}
async function connectDB() {
    if (cachedClient) {
        return cachedClient.db(dbName);
    }
    if (!cachedClientPromise) {
        const client = new mongodb_1.MongoClient(uri);
        cachedClientPromise = client.connect().then(async () => {
            globalThis.__mongoClient = client;
            console.log('MongoDB online ✅');
            const db = client.db(dbName);
            await ensureIndexes(db);
            return client;
        });
        globalThis.__mongoClientPromise = cachedClientPromise;
    }
    const client = await cachedClientPromise;
    // update local cachedClient in case it wasn't set yet
    cachedClient = client;
    return client.db(dbName);
}
// redo cache logic for db instance

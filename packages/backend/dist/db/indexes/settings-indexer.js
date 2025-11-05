"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongo_js_1 = require("../mongo.js");
/**
 * Creates indexes for the settings collection
 * Run this script once to set up the indexes
 */
async function createSettingsIndexes() {
    try {
        const db = await (0, mongo_js_1.connectDB)();
        const collection = db.collection('settings');
        // Index on customerId (unique)
        await collection.createIndex({ customerId: 1 }, {
            unique: true,
            name: 'customerId_unique'
        });
        // Index on updatedAt (for sorting/filtering)
        await collection.createIndex({ updatedAt: -1 }, { name: 'updatedAt_desc' });
        process.exit(0);
    }
    catch (error) {
        console.error('Error creating settings indexes:', error);
        process.exit(1);
    }
}
createSettingsIndexes();

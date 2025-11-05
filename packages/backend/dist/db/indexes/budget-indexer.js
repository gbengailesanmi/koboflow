"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBudgetIndexes = createBudgetIndexes;
exports.migrateBudgetPeriod = migrateBudgetPeriod;
const mongo_1 = require("@/db/mongo");
/**
 * Create indexes for budgets collection
 */
async function createBudgetIndexes() {
    const db = await (0, mongo_1.connectDB)();
    // Budgets collection indexes
    await db.collection('budgets').createIndex({ customerId: 1 }, { unique: true, name: 'customerId_unique' });
    await db.collection('budgets').createIndex({ updatedAt: -1 }, { name: 'updatedAt_desc' });
    // Index for period type queries (useful for analytics)
    await db.collection('budgets').createIndex({ 'period.type': 1 }, { name: 'period_type', sparse: true });
    // Index for recurring period start dates
    await db.collection('budgets').createIndex({ 'period.startDate': 1 }, { name: 'period_startDate', sparse: true });
}
/**
 * Migrate existing budgets to add period field
 */
async function migrateBudgetPeriod() {
    const db = await (0, mongo_1.connectDB)();
    const budgetsCollection = db.collection('budgets');
    const totalBudgets = await budgetsCollection.countDocuments();
    // Add default period (current-month) to budgets that don't have one
    const result = await budgetsCollection.updateMany({ period: { $exists: false } }, {
        $set: {
            period: {
                type: 'current-month'
            },
            updatedAt: new Date()
        }
    });
    const budgetsWithPeriod = await budgetsCollection.countDocuments({
        period: { $exists: true }
    });
}
// Run this script to create indexes and migrate data
if (require.main === module) {
    Promise.all([
        createBudgetIndexes(),
        migrateBudgetPeriod()
    ])
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
}

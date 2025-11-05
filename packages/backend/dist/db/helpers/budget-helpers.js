"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBudget = getBudget;
exports.upsertBudget = upsertBudget;
exports.updateMonthlyBudget = updateMonthlyBudget;
exports.updateCategoryBudgets = updateCategoryBudgets;
exports.updateBudgetPeriod = updateBudgetPeriod;
exports.updateBudgetWithPeriod = updateBudgetWithPeriod;
const mongo_1 = require("@/db/mongo");
/**
 * Get or create budget for a customer
 */
async function getBudget(customerId) {
    const db = await (0, mongo_1.connectDB)();
    return db.collection('budgets').findOne({ customerId });
}
/**
 * Create or update budget for a customer
 */
async function upsertBudget(customerId, totalBudgetLimit, categories, period) {
    const db = await (0, mongo_1.connectDB)();
    const updateFields = {
        totalBudgetLimit,
        categories,
        updatedAt: new Date()
    };
    // Include period if provided, otherwise keep existing or use default
    if (period) {
        updateFields.period = period;
    }
    await db.collection('budgets').updateOne({ customerId }, {
        $set: updateFields,
        $setOnInsert: {
            customerId,
            createdAt: new Date()
        }
    }, { upsert: true });
}
/**
 * Update monthly budget
 */
async function updateMonthlyBudget(customerId, totalBudgetLimit, period) {
    const db = await (0, mongo_1.connectDB)();
    const updateFields = {
        totalBudgetLimit,
        updatedAt: new Date()
    };
    // Include period if provided
    if (period) {
        updateFields.period = period;
    }
    await db.collection('budgets').updateOne({ customerId }, {
        $set: updateFields
    });
}
/**
 * Update category budgets
 */
async function updateCategoryBudgets(customerId, categories) {
    const db = await (0, mongo_1.connectDB)();
    await db.collection('budgets').updateOne({ customerId }, {
        $set: {
            categories,
            updatedAt: new Date()
        }
    });
}
/**
 * Update budget period
 */
async function updateBudgetPeriod(customerId, period) {
    const db = await (0, mongo_1.connectDB)();
    await db.collection('budgets').updateOne({ customerId }, {
        $set: {
            period,
            updatedAt: new Date()
        }
    });
}
/**
 * Update budget with period (convenience function)
 */
async function updateBudgetWithPeriod(customerId, totalBudgetLimit, categories, period) {
    const db = await (0, mongo_1.connectDB)();
    const updateFields = {
        totalBudgetLimit,
        categories,
        updatedAt: new Date()
    };
    if (period) {
        updateFields.period = period;
    }
    await db.collection('budgets').updateOne({ customerId }, {
        $set: updateFields
    }, { upsert: true });
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCustomCategories = getCustomCategories;
exports.getCustomCategory = getCustomCategory;
exports.createCustomCategory = createCustomCategory;
exports.updateCustomCategory = updateCustomCategory;
exports.deleteCustomCategory = deleteCustomCategory;
const mongo_1 = require("@/db/mongo");
const uuid_1 = require("uuid");
async function getCustomCategories(customerId) {
    const db = await (0, mongo_1.connectDB)();
    const categories = await db
        .collection('spending_categories')
        .find({ customerId })
        .sort({ createdAt: -1 })
        .toArray();
    return categories.map((cat) => ({
        id: cat.id || cat._id.toString(),
        customerId: cat.customerId,
        name: cat.name,
        keywords: cat.keywords || [],
        color: cat.color || '#6b7280',
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt
    }));
}
async function getCustomCategory(customerId, id) {
    const db = await (0, mongo_1.connectDB)();
    const category = await db
        .collection('spending_categories')
        .findOne({ customerId, id });
    if (!category)
        return null;
    return {
        id: category.id || category._id.toString(),
        customerId: category.customerId,
        name: category.name,
        keywords: category.keywords || [],
        color: category.color || '#6b7280',
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    };
}
async function createCustomCategory(customerId, input) {
    const db = await (0, mongo_1.connectDB)();
    const id = (0, uuid_1.v4)();
    const category = {
        id,
        customerId,
        name: input.name,
        keywords: input.keywords,
        color: input.color || '#6b7280',
        createdAt: new Date(),
        updatedAt: new Date()
    };
    await db.collection('spending_categories').insertOne(category);
    return category;
}
async function updateCustomCategory(customerId, id, input) {
    const db = await (0, mongo_1.connectDB)();
    const updateData = {
        updatedAt: new Date()
    };
    if (input.name)
        updateData.name = input.name;
    if (input.keywords)
        updateData.keywords = input.keywords;
    if (input.color)
        updateData.color = input.color;
    const result = await db
        .collection('spending_categories')
        .updateOne({ customerId, id }, { $set: updateData });
    return result.matchedCount > 0;
}
async function deleteCustomCategory(customerId, id) {
    const db = await (0, mongo_1.connectDB)();
    const result = await db
        .collection('spending_categories')
        .deleteOne({ customerId, id });
    return result.deletedCount > 0;
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRoutes = void 0;
const express_1 = require("express");
exports.categoryRoutes = (0, express_1.Router)();
// TODO: Migrate custom categories logic from Next.js API routes
exports.categoryRoutes.get('/', async (req, res) => {
    res.json({ message: 'Get categories endpoint - to be implemented' });
});
exports.categoryRoutes.post('/', async (req, res) => {
    res.json({ message: 'Create category endpoint - to be implemented' });
});

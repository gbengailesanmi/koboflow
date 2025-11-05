"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.budgetRoutes = void 0;
const express_1 = require("express");
exports.budgetRoutes = (0, express_1.Router)();
// TODO: Migrate budget logic from Next.js API routes
exports.budgetRoutes.get('/', async (req, res) => {
    res.json({ message: 'Get budget endpoint - to be implemented' });
});
exports.budgetRoutes.post('/', async (req, res) => {
    res.json({ message: 'Create/Update budget endpoint - to be implemented' });
});

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionRoutes = void 0;
const express_1 = require("express");
exports.transactionRoutes = (0, express_1.Router)();
// TODO: Implement transaction endpoints
exports.transactionRoutes.get('/', async (req, res) => {
    res.json({ message: 'Get transactions endpoint - to be implemented' });
});

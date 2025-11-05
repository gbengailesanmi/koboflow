"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_js_1 = require("./routes/auth.js");
const budget_js_1 = require("./routes/budget.js");
const transactions_js_1 = require("./routes/transactions.js");
const settings_js_1 = require("./routes/settings.js");
const categories_js_1 = require("./routes/categories.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_js_1.authRoutes);
app.use('/api/budget', budget_js_1.budgetRoutes);
app.use('/api/transactions', transactions_js_1.transactionRoutes);
app.use('/api/settings', settings_js_1.settingsRoutes);
app.use('/api/categories', categories_js_1.categoryRoutes);
// Error handling middleware
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});
// Start server
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`🚀 Backend server running on port ${PORT}`);
    });
}
exports.default = app;

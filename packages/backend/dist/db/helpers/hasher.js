"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasher = hasher;
const crypto_1 = __importDefault(require("crypto"));
function hasher(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    return crypto_1.default.createHash('sha256').update(str).digest('hex');
}

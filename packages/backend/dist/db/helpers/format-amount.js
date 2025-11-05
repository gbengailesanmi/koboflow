"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatAmount = void 0;
const formatAmount = (unscaledValue, scale) => {
    const value = Number(unscaledValue);
    const scaleNum = Number(scale);
    const result = value * Math.pow(10, -scaleNum);
    return result.toFixed(2);
};
exports.formatAmount = formatAmount;

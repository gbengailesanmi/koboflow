"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAccountUniqueId = void 0;
const hasher_1 = require("@/db/helpers/hasher");
const getAccountUniqueId = (account) => {
    const sortCode = account.identifiers?.sortCode?.code ?? '';
    const accountNumber = account.identifiers?.sortCode?.accountNumber ?? '';
    const finIstitutionId = account.financialInstitutionId ?? '';
    const uid = `${accountNumber}${finIstitutionId}${sortCode}`;
    return (0, hasher_1.hasher)(uid);
};
exports.getAccountUniqueId = getAccountUniqueId;

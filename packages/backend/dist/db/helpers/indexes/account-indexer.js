"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.accountIndexer = accountIndexer;
let accountsIndexed = false;
async function accountIndexer(accountCollection) {
    if (accountsIndexed)
        return;
    await accountCollection.createIndex({ uniqueId: 1, customerId: 1 }, { unique: true });
    accountsIndexed = true;
}

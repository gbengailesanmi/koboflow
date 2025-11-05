"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkInsertAccounts = bulkInsertAccounts;
const account_indexer_1 = require("@/db/helpers/indexes/account-indexer");
async function insertAccounts(accounts, customerId, connectDB) {
    if (!Array.isArray(accounts) || accounts.length === 0)
        return;
    if (!customerId)
        throw new Error('Customer ID is required');
    const db = await connectDB();
    const accountCollection = db.collection('accounts');
    await (0, account_indexer_1.accountIndexer)(accountCollection); // Set up unique indexes on uniqueId and customerId
    const records = accounts.map((account) => ({
        id: account.id,
        customerId,
        uniqueId: account.unique_id,
        name: account.name,
        type: account.type,
        bookedAmount: parseInt(account.balances.booked.amount.value.unscaledValue, 10),
        bookedScale: parseInt(account.balances?.booked?.amount?.value?.scale, 10),
        bookedCurrency: account.balances?.booked?.amount?.currencyCode,
        availableAmount: parseInt(account.balances?.available?.amount?.value?.unscaledValue, 10),
        availableScale: parseInt(account.balances?.available?.amount?.value?.scale, 10),
        availableCurrency: account.balances?.available?.amount?.currencyCode,
        balance: account.balanceFormatted,
        identifiers: account.identifiers,
        lastRefreshed: new Date(new Date(account.dates.lastRefreshed).toLocaleString('en-GB', { timeZone: 'Europe/London' })),
        financialInstitutionId: account.financialInstitutionId,
        customerSegment: account.customerSegment,
    }));
    try {
        await accountCollection.insertMany(records, { ordered: false });
    }
    catch (err) {
        if (err.code !== 11000)
            throw err;
    }
}
async function bulkInsertAccounts(accounts, customerId, connectDB) {
    return insertAccounts(accounts, customerId, connectDB);
}

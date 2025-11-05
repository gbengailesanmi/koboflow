"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkInsertTransactions = bulkInsertTransactions;
const format_narration_1 = require("./format-narration");
const transaction_indexer_1 = require("@/db/helpers/indexes/transaction-indexer");
async function insertTransactions(transactions, customerId, connectDB) {
    if (!Array.isArray(transactions) || transactions.length === 0)
        return;
    if (!customerId)
        throw new Error('Customer ID is required');
    const db = await connectDB();
    const txnCollection = db.collection('transactions');
    await (0, transaction_indexer_1.transactionIndexer)(txnCollection); // Set up unique indexes on (customerId, accountUniqueId, Trxnid)
    const records = transactions.map((txn) => ({
        id: txn.id,
        transactionUniqueId: (0, transaction_indexer_1.idHash)(txn),
        accountUniqueId: txn.accountUniqueId,
        accountId: txn.accountId,
        customerId,
        amount: txn.amountFormatted,
        unscaledValue: parseInt(txn.amount.value.unscaledValue, 10),
        scale: parseInt(txn.amount.value.scale, 10),
        narration: (0, format_narration_1.formatNarration)(txn.descriptions?.original),
        currencyCode: txn.amount?.currencyCode,
        descriptions: txn.descriptions,
        bookedDate: new Date(txn.dates.booked),
        identifiers: txn.identifiers,
        types: txn.types,
        status: txn.status,
        providerMutability: txn.providerMutability,
    }));
    try {
        await txnCollection.insertMany(records, { ordered: false });
    }
    catch (err) {
        if (err.code !== 11000)
            throw err;
    }
}
async function bulkInsertTransactions(transactions, customerId, connectDB) {
    return insertTransactions(transactions, customerId, connectDB);
}

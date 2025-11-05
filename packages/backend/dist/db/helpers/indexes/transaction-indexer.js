"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionIndexer = transactionIndexer;
exports.idHash = idHash;
const hasher_1 = require("@/db/helpers/hasher");
const format_narration_1 = require("@/db/helpers/format-narration");
let transactionsIndexed = false;
async function transactionIndexer(txnCollection) {
    if (transactionsIndexed)
        return;
    // Unique index to prevent duplicates using generated hash
    await txnCollection.createIndex({ customerId: 1, transactionUniqueId: 1 }, { unique: true });
    // Optional index to speed up queries by bookedDate
    await txnCollection.createIndex({ customerId: 1, bookedDate: -1 });
    transactionsIndexed = true;
}
function idHash(txn) {
    const str = [
        txn.accountUniqueId,
        txn.amount?.value?.unscaledValue ?? '',
        txn.amount?.value?.scale ?? '',
        txn.dates?.booked ?? '',
        (0, format_narration_1.formatNarration)(txn.descriptions?.original) ?? '',
    ].join('|');
    return (0, hasher_1.hasher)(str);
}

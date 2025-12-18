import { transactionIndexer } from './indexes/transaction-indexer'

async function insertMonoTransactions(transactions: any[], customerId: string, connectDB: any) {
  if (!Array.isArray(transactions) || transactions.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')

  const db = await connectDB()
  const txnCollection = db.collection('transactions')
  await transactionIndexer(txnCollection)

  const records = transactions.map((txn: any) => ({
    id: txn.id,
    transactionUniqueId: txn.transactionUniqueId,
    accountUniqueId: txn.accountUniqueId,
    accountId: txn.accountId,
    customerId,
    amount: txn.amount,
    amountRaw: txn.amountRaw,
    unscaledValue: txn.amountRaw, // For compatibility with existing code
    scale: 2, // Mono uses kobo (2 decimal places)
    type: txn.type, // 'debit' or 'credit'
    narration: txn.narration,
    currencyCode: txn.currencyCode,
    category: txn.category,
    balance: txn.balance,
    bookedDate: txn.bookedDate,
    provider: 'mono',
  }))

  try {
    await txnCollection.insertMany(records, { ordered: false })
  } catch (err: any) {
    // Ignore duplicate key errors (11000)
    if (err.code !== 11000) throw err
  }
}

async function bulkInsertMonoTransactions(transactions: any[], customerId: string, connectDB: any) {
  return insertMonoTransactions(transactions, customerId, connectDB)
}

export { bulkInsertMonoTransactions }

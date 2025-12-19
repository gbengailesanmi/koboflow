import { transactionIndexer } from './indexes/transaction-indexer'

/**
 * Insert Mono transactions in exact API format
 * Stores the exact Mono transaction object plus metadata
 */
async function insertMonoTransactions(
  transactions: any[], 
  customerId: string, 
  accountId: string,
  connectDB: any
) {
  if (!Array.isArray(transactions) || transactions.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')
  if (!accountId) throw new Error('Account ID is required')

  const db = await connectDB()
  const txnCollection = db.collection('transactions')
  await transactionIndexer(txnCollection)

  const records = transactions.map((txn: any) => ({
    id: txn.id,
    narration: txn.narration,
    amount: txn.amount,
    type: txn.type,
    balance: txn.balance,
    date: txn.date,
    category: txn.category,
    accountId,
    customerId,
  }))

  const bulkOps = records.map((record) => ({
    updateOne: {
      filter: { 
        customerId: record.customerId,
        id: record.id 
      },
      update: { $set: record },
      upsert: true,
    },
  }))

  try {
    const result = await txnCollection.bulkWrite(bulkOps, { ordered: false })
    console.log(`Transaction insert result:`, {
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      matched: result.matchedCount,
      total: records.length,
    })
  } catch (err: any) {
    console.error('Error inserting transactions:', err.message)
    throw err
  }
}

async function bulkInsertMonoTransactions(
  transactions: any[], 
  customerId: string, 
  accountId: string,
  connectDB: any
) {
  return insertMonoTransactions(transactions, customerId, accountId, connectDB)
}

export { bulkInsertMonoTransactions }

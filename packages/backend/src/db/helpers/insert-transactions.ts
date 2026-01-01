import { createHash } from 'crypto'
import { EnrichedTransaction, MonoTransaction, logger } from '@money-mapper/shared'
import { transactionIndexer } from './indexes/transaction-indexer'

function generateTransactionHash(txn: EnrichedTransaction): string {
  const data = [
    txn.customerId,
    txn.accountNumber,
    txn.bankCode,
    txn.amount,
    txn.date,
    txn.narration,
    txn.type,
  ].join('|')

  return createHash('sha256').update(data).digest('hex')
}

async function insertTransactions(
  transactions: MonoTransaction[],
  customerId: string,
  accountId: string,
  connectDB: () => Promise<any>
) {
  if (!Array.isArray(transactions) || transactions.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')
  if (!accountId) throw new Error('Account ID is required')

  const db = await connectDB()
  const txnCollection = db.collection('transactions')
  await transactionIndexer(txnCollection)

  // Fetch account for stable identifiers
  const accountCollection = db.collection('accounts')
  const account = await accountCollection.findOne({
    customerId,
    id: accountId,
  })

  if (!account) {
    throw new Error(`Account not found: ${accountId}`)
  }

  // const debugTransactions = transactions.slice(0, 3) // debug


  const enrichedTransactions: EnrichedTransaction[] = transactions.map(txn => ({
    id: txn.id,
    narration: txn.narration,
    amount: txn.amount,
    type: txn.type,
    balance: txn.balance,
    date: txn.date,


    category: txn.category ?? 'uncategorised',

    customerId,
    accountId,
    accountNumber: account.account_number,
    bankCode: account.institution.bank_code,
  }))


  const records: EnrichedTransaction[] = enrichedTransactions.map(txn => ({
    ...txn,
    hash: generateTransactionHash(txn),
  }))

  const bulkOps = records.map(record => ({
    updateOne: {
      filter: {
        customerId: record.customerId,
        hash: record.hash,
      },
      update: { $setOnInsert: record },
      upsert: true,
    },
  }))

  try {
    const result = await txnCollection.bulkWrite(bulkOps, { ordered: false })

    logger.info({
      module: 'insert-transactions',
      inserted: result.upsertedCount,
      matched: result.matchedCount,
      modified: result.modifiedCount,
      total: records.length,
    }, 'Transaction insert result')
  } catch (err: any) {
    logger.error({
      module: 'insert-transactions',
      error: err.message,
    }, 'Error inserting transactions')
    throw err
  }
}

async function bulkInsertTransactions(
  transactions: MonoTransaction[],
  customerId: string,
  accountId: string,
  connectDB: () => Promise<any>
) {
  return insertTransactions(transactions, customerId, accountId, connectDB)
}

export { bulkInsertTransactions }

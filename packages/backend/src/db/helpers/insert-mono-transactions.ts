import { createHash } from 'crypto'
import { transactionIndexer } from './indexes/transaction-indexer'

function generateTransactionHash(
  customerId: string,
  accountNumber: string,
  bankCode: string,
  amount: number,
  date: string,
  narration: string,
  type: string
): string {
  const data = `${customerId}${accountNumber}${bankCode}${amount}${date}${narration}${type}`
  return createHash('sha256').update(data).digest('hex')
}

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

  // Fetch account details to get stable identifiers (account number + bank code)
  const accountCollection = db.collection('accounts')
  const account = await accountCollection.findOne({ 
    customerId,
    id: accountId 
  })

  if (!account) {
    throw new Error(`Account not found: ${accountId}`)
  }

  const accountNumber = account.account_number
  const bankCode = account.institution.bank_code

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
    accountNumber,  // Add stable identifier
    bankCode,       // Add stable identifier
    hash: generateTransactionHash(
      customerId,
      accountNumber,
      bankCode,
      txn.amount,
      txn.date,
      txn.narration,
      txn.type
    ),
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

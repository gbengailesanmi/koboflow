import { formatNarration } from './format-narration'
import { transactionIndexer, getHash } from '@/db/helpers/init/transaction-indexer'

async function insertTransactions(transactions: any[], customerId: string, connectDB: any) {
  if (!Array.isArray(transactions) || transactions.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')

  const db = await connectDB()
  const txnCollection = db.collection('transactions')
  await transactionIndexer(txnCollection) // Set up unique indexes on (customerId, accountUniqueId, Trxnid)

  const records = transactions.map((txn: any) => ({
    id: txn.id,
    transactionUniqueId: getHash(txn),
    accountUniqueId: txn.accountUniqueId,
    accountId: txn.accountId,
    customerId,
    amount: txn.amountFormatted,
    unscaledValue: parseInt(txn.amount.value.unscaledValue, 10),
    scale: parseInt(txn.amount.value.scale, 10),
    narration: formatNarration(txn.descriptions?.original),
    currencyCode: txn.amount?.currencyCode,
    descriptions: txn.descriptions,
    bookedDate: new Date(
      new Date(txn.dates.booked).toLocaleString('en-GB', { timeZone: 'Europe/London' })
    ),
    identifiers: txn.identifiers,
    types: txn.types,
    status: txn.status,
    providerMutability: txn.providerMutability,
  }))

  try {
    await txnCollection.insertMany(records, { ordered: false })
  } catch (err: any) {
    if (err.code !== 11000) throw err
  }
}

async function bulkInsertTinkTransactions(transactions: any[], customerId: string, connectDB: any) {
  return insertTransactions(transactions, customerId, connectDB)
}

export { bulkInsertTinkTransactions }

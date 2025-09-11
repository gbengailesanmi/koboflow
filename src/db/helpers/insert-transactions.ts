import { connectDB } from '@/db/mongo'
import { formatAmount } from './format-amount'
import { formatNarration } from './format-narration'

async function insertTransactions(transactions: any[], customerId: string) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { message: 'No transactions to insert', insertedCount: 0 }
  }

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  const db = await connectDB()
  const col = db.collection('transactions')

  const ops = transactions.map((txn: any) => {
    const doc = {
      id: txn.id,
      accountUniqueId: txn.accountUniqueId ?? null,
      accountId: txn.accountId ?? null,
      customerId,
      amount: txn.amountFormatted ?? formatAmount(txn.amount?.value?.unscaledValue, txn.amount?.value?.scale),
      unscaledValue: txn.amount?.value?.unscaledValue ? parseInt(txn.amount.value.unscaledValue, 10) : null,
      scale: txn.amount?.value?.scale ? parseInt(txn.amount.value.scale, 10) : null,
      narration: formatNarration(txn.descriptions?.original ?? txn.narration ?? ''),
      currencyCode: txn.amount?.currencyCode ?? null,
      descriptions: txn.descriptions ?? {},
      bookedDate: txn.dates?.booked ? new Date(txn.dates.booked) : null,
      identifiers: txn.identifiers ?? {},
      types: txn.types ?? {},
      status: txn.status ?? null,
      providerMutability: txn.providerMutability ?? null,
    }

    return {
      updateOne: {
        filter: { id: txn.id },
        update: { $set: doc },
        upsert: true,
      },
    }
  })

  const result = await col.bulkWrite(ops, { ordered: false })
  return result
}

async function bulkInsertTinkTransactions(
  transactions: any[],
  customerId: string
) {
  await insertTransactions(transactions, customerId)
}

export { bulkInsertTinkTransactions }
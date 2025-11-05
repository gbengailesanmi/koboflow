import { hasher } from '@/db/helpers/hasher'
import { formatNarration } from '@/db/helpers/format-narration'

let transactionsIndexed = false

async function transactionIndexer(txnCollection: any) {
  if (transactionsIndexed) return

  // Unique index to prevent duplicates using generated hash
  await txnCollection.createIndex(
    { customerId: 1, transactionUniqueId: 1 },
    { unique: true }
  )

  // Optional index to speed up queries by bookedDate
  await txnCollection.createIndex(
    { customerId: 1, bookedDate: -1 }
  )

  transactionsIndexed = true
}

function idHash(txn: any) {
  const str = [
    txn.accountUniqueId,
    txn.amount?.value?.unscaledValue ?? '',
    txn.amount?.value?.scale ?? '',
    txn.dates?.booked ?? '',
    formatNarration(txn.descriptions?.original) ?? '',
  ].join('|')

  return hasher(str)
}

export { transactionIndexer, idHash }
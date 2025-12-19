import { hasher } from '../hasher'

let transactionsIndexed = false

async function transactionIndexer(txnCollection: any) {
  if (transactionsIndexed) return

  await txnCollection.createIndex(
    { customerId: 1, id: 1 },
    { unique: true }
  )

  await txnCollection.createIndex(
    { customerId: 1, date: -1 }
  )

  transactionsIndexed = true
}

function idHash(txn: any) {
  const narration = txn.descriptions?.original
  const formattedNarration = typeof narration === 'string' ? narration.trim().toLowerCase() : ''
  
  const str = [
    txn.accountUniqueId,
    txn.amount?.value?.unscaledValue ?? '',
    txn.amount?.value?.scale ?? '',
    txn.dates?.booked ?? '',
    formattedNarration,
  ].join('|')

  return hasher(str)
}

export { transactionIndexer, idHash }
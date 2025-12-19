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

export { transactionIndexer }
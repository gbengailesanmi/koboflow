export async function transactionIndexer(txnCollection: any) {
  await txnCollection.createIndex(
    { customerId: 1, id: 1 },
    { unique: true }
  )

  await txnCollection.createIndex(
    { customerId: 1, date: -1 }
  )

await txnCollection.createIndex(
    { hash: 1 },
    { unique: true, sparse: true }
  )
}

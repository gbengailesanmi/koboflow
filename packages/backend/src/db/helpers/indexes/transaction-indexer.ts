export async function transactionIndexer(txnCollection: any) {
  // Unique: Prevent duplicate Mono transactions for same customer
  await txnCollection.createIndex(
    { customerId: 1, id: 1 },
    { unique: true }
  )

  // Query: Fast lookup by customer and date (for transaction lists)
  await txnCollection.createIndex(
    { customerId: 1, date: -1 }
  )

  // Query: Fast lookup by account (using stable identifiers)
  await txnCollection.createIndex(
    { customerId: 1, accountNumber: 1, bankCode: 1, date: -1 }
  )

  // Unique: Prevent duplicate transactions using hash (true deduplication)
  // hash = sha256(customerId + accountNumber + bankCode + amount + date + narration + type)
  await txnCollection.createIndex(
    { hash: 1 },
    { unique: true, sparse: true }
  )
}

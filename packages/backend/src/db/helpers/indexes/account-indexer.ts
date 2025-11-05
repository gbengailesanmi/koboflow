let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  await accountCollection.createIndex(
    { uniqueId: 1, customerId: 1 },
    { unique: true }
  )

  accountsIndexed = true
}

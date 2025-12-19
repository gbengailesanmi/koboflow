let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  await accountCollection.createIndex(
    { id: 1 },
    { unique: true }
  )

  accountsIndexed = true
}

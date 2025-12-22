let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  await accountCollection.createIndex(
    { 
      bvn: 1,
      account_number: 1,
      'institution.bank_code': 1
    },
    { 
      unique: true,
      partialFilterExpression: { bvn: { $type: 'string' } }
    }
  )

  // Index for querying accounts by app customer
  await accountCollection.createIndex(
    { customerId: 1 }
  )

  await accountCollection.createIndex(
    { bvn: 1 },
    { partialFilterExpression: { bvn: { $type: 'string' } } }
  )

  accountsIndexed = true
}

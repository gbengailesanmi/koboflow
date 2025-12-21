let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  // Unique constraint: Same BVN cannot add same account from same bank
  // This prevents duplicate accounts even across app accounts/sessions
  // Note: BVN is stored as last 4 digits (matching production behavior)
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

  // Index for BVN queries (helps with validation)
  await accountCollection.createIndex(
    { bvn: 1 },
    { partialFilterExpression: { bvn: { $type: 'string' } } }
  )

  accountsIndexed = true
}

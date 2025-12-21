let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  // Unique constraint: Same BVN cannot add same account from same bank
  // This prevents duplicate accounts even across app accounts/sessions
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

  // Unique constraint: One customerId = One BVN
  // Prevents linking accounts with different BVNs to same app account
  await accountCollection.createIndex(
    { customerId: 1, bvn: 1 },
    { 
      unique: true,
      partialFilterExpression: { bvn: { $type: 'string' } }
    }
  )

  // Index for querying accounts by app customer
  await accountCollection.createIndex(
    { customerId: 1 }
  )

  accountsIndexed = true
}

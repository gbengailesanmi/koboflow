let accountsIndexed = false

export async function accountIndexer(accountCollection: any) {
  if (accountsIndexed) return

  await accountCollection.createIndex(
    { 
      customerId: 1,
      account_number: 1,
      'institution.bank_code': 1
    },
    { unique: true }
  )

  await accountCollection.createIndex(
    { customerId: 1 }
  )

  accountsIndexed = true
}

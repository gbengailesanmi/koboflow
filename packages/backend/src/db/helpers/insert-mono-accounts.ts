import { accountIndexer } from './indexes/account-indexer'

async function insertMonoAccounts(accounts: any[], customerId: string, connectDB: any) {
  if (!Array.isArray(accounts) || accounts.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')

  const db = await connectDB()
  const accountCollection = db.collection('accounts')
  await accountIndexer(accountCollection)

  const records = accounts.map((account: any) => ({
    id: account.id,
    customerId,
    uniqueId: account.uniqueId,
    name: account.name,
    type: account.type,
    accountNumber: account.accountNumber,
    balance: account.balance,
    balanceRaw: account.balanceRaw,
    currency: account.currency,
    institution: account.institution,
    bvn: account.bvn,
    dataStatus: account.dataStatus,
    authMethod: account.authMethod,
    lastRefreshed: account.lastRefreshed,
    provider: 'mono',
  }))

  try {
    // Use upsert to update existing accounts or insert new ones
    for (const record of records) {
      await accountCollection.updateOne(
        { uniqueId: record.uniqueId, customerId },
        { $set: record },
        { upsert: true }
      )
    }
  } catch (err: any) {
    if (err.code !== 11000) throw err
  }
}

async function bulkInsertMonoAccounts(accounts: any[], customerId: string, connectDB: any) {
  return insertMonoAccounts(accounts, customerId, connectDB)
}

export { bulkInsertMonoAccounts }

import { accountIndexer } from './indexes/account-indexer'

async function insertMonoAccounts(accounts: any[], customerId: string, connectDB: any) {
  if (!Array.isArray(accounts) || accounts.length === 0) return
  if (!customerId) throw new Error('Customer ID is required')

  const db = await connectDB()
  const accountCollection = db.collection('accounts')
  await accountIndexer(accountCollection)

  const records = accounts.map((account: any) => ({
    id: account.id,
    name: account.name,
    currency: account.currency,
    type: account.type,
    account_number: account.account_number,
    balance: account.balance,
    bvn: account.bvn,
    institution: account.institution,
    customerId,
    monoCustomerId: account.monoCustomerId,
    meta: account.meta,
    lastRefreshed: account.lastRefreshed || new Date(),
    provider: 'mono',
  }))

  try {
    for (const record of records) {
      await accountCollection.updateOne(
        { id: record.id, customerId },
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

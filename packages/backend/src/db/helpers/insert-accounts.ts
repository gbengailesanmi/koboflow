import { accountIndexer } from './indexes/account-indexer'

async function insertAccounts(accounts: any[], customerId: string, connectDB: any) {
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
        { 
          bvn: record.bvn,
          account_number: record.account_number,
          'institution.bank_code': record.institution.bank_code
        },
        { 
          $set: {
            // Update these fields on re-link
            balance: record.balance,
            lastRefreshed: record.lastRefreshed,
            meta: record.meta,
            name: record.name,
            currency: record.currency,
            type: record.type,
            // Keep new Mono session info
            monoCustomerId: record.monoCustomerId,
          },
          $setOnInsert: {
            // Only set these on first insert (preserve on re-link)
            id: record.id,
            customerId: record.customerId,
            bvn: record.bvn,
            account_number: record.account_number,
            institution: record.institution,
            provider: record.provider,
          }
        },
        { upsert: true }
      )
    }
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate key error - determine which constraint was violated
      if (err.message.includes('customerId_1_bvn_1')) {
        throw new Error('Cannot link accounts with different BVNs to the same customer account')
      }
      if (err.message.includes('bvn_1_account_number_1')) {
        throw new Error('This account is already linked to this BVN')
      }
      throw new Error('Duplicate account detected')
    }
    throw err
  }
}

async function bulkInsertAccounts(accounts: any[], customerId: string, connectDB: any) {
  return insertAccounts(accounts, customerId, connectDB)
}

export { bulkInsertAccounts }

import { accountIndexer } from '@/db/helpers/indexes/account-indexer'

async function insertAccounts(accounts: any[], customerId: string, connectDB: any) {
  if (!Array.isArray(accounts) || accounts.length === 0) return

  if (!customerId) throw new Error('Customer ID is required')

  const db = await connectDB()
  const accountCollection = db.collection('accounts')
  await accountIndexer(accountCollection) // Set up unique indexes on uniqueId and customerId

  const records = accounts.map((account: any) => ({
    id: account.id,
    customerId,
    uniqueId: account.unique_id,
    name: account.name,
    type: account.type,
    bookedAmount: parseInt(account.balances.booked.amount.value.unscaledValue, 10),
    bookedScale: parseInt(account.balances?.booked?.amount?.value?.scale, 10),
    bookedCurrency: account.balances?.booked?.amount?.currencyCode,
    availableAmount: parseInt(account.balances?.available?.amount?.value?.unscaledValue, 10),
    availableScale: parseInt(account.balances?.available?.amount?.value?.scale, 10),
    availableCurrency: account.balances?.available?.amount?.currencyCode,
    balance: account.balanceFormatted,
    identifiers: account.identifiers,
    lastRefreshed: new Date(
      new Date(account.dates.lastRefreshed).toLocaleString('en-GB', { timeZone: 'Europe/London' })
    ),
    financialInstitutionId: account.financialInstitutionId,
    customerSegment: account.customerSegment,
  }))

  try {
    await accountCollection.insertMany(records, { ordered: false })
  } catch (err: any) {
    if (err.code !== 11000) throw err
  }
}

async function bulkInsertTinkAccounts(accounts: any[], customerId: string, connectDB: any) {
  return insertAccounts(accounts, customerId, connectDB)
}

export { bulkInsertTinkAccounts }

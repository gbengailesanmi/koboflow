import { connectDB } from '@/db/mongo'
import { formatAmount } from './format-amount'
import { getUniqueId } from './unique-id'

async function insertAccounts(accounts: any[], customerId: string) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { message: 'No accounts to insert', insertedCount: 0 }
  }

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  const db = await connectDB()
  const col = db.collection('accounts')

  const ops = accounts.map((account: any) => {
    const doc = {
      id: account.id,
      customerId,
      uniqueId: account.unique_id ?? getUniqueId(account),
      name: account.name,
      type: account.type,
      bookedAmount: parseInt(account.balances?.booked?.amount?.value?.unscaledValue ?? '0', 10),
      bookedScale: parseInt(account.balances?.booked?.amount?.value?.scale ?? '0', 10),
      bookedCurrency: account.balances?.booked?.amount?.currencyCode ?? null,
      availableAmount: parseInt(account.balances?.available?.amount?.value?.unscaledValue ?? '0', 10),
      availableScale: parseInt(account.balances?.available?.amount?.value?.scale ?? '0', 10),
      availableCurrency: account.balances?.available?.amount?.currencyCode ?? null,
      balance: account.balanceFormatted ?? formatAmount(account.balances?.booked?.amount?.value?.unscaledValue, account.balances?.booked?.amount?.value?.scale),
      identifiers: account.identifiers ?? {},
      lastRefreshed: account.dates?.lastRefreshed ? new Date(account.dates.lastRefreshed) : new Date(),
      financialInstitutionId: account.financialInstitutionId ?? null,
      customerSegment: account.customerSegment ?? null,
    }

    return {
      updateOne: {
        filter: { id: account.id },
        update: { $set: doc },
        upsert: true,
      },
    }
  })

  const result = await col.bulkWrite(ops, { ordered: false })
  return result
}

async function bulkInsertTinkAccounts(
  accounts: any[],
  customerId: string
) {
  await insertAccounts(accounts, customerId)
}

export { bulkInsertTinkAccounts }
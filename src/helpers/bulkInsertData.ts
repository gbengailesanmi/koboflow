import { db } from '@/lib/db'
import { accounts as accountSchema, transactions as trxnSchema } from '../../drizzle/schema'

export async function bulkInsertTinkData(
  accounts: any[],
  transactions: any[],
  customerId: string
) {
  // Bulk insert accounts
  await db.insert(accountSchema).values(
    accounts.map((account: any) => ({
      id: account.id,
      customerId,
      name: account.name,
      type: account.type,
      bookedAmount: parseInt(account.balances.booked.amount.value.unscaledValue, 10),
      bookedScale: parseInt(account.balances.booked.amount.value.scale, 10),
      bookedCurrency: account.balances.booked.amount.currencyCode,
      availableAmount: parseInt(account.balances.available.amount.value.unscaledValue, 10),
      availableScale: parseInt(account.balances.available.amount.value.scale, 10),
      availableCurrency: account.balances.available.amount.currencyCode,
      identifiers: account.identifiers,
      lastRefreshed: new Date(account.dates.lastRefreshed),
      financialInstitutionId: account.financialInstitutionId,
      customerSegment: account.customerSegment,
    }))
  )

  // Bulk insert transactions
  await db.insert(trxnSchema).values(
    transactions.map((txn: any) => ({
      id: txn.id,
      accountId: txn.accountId,
      customerId,
      unscaledValue: parseInt(txn.amount.value.unscaledValue, 10),
      scale: parseInt(txn.amount.value.scale, 10),
      currencyCode: txn.amount.currencyCode,
      descriptions: txn.descriptions,
      bookedDate: new Date(txn.dates.booked),
      identifiers: txn.identifiers,
      types: txn.types,
      status: txn.status,
      providerMutability: txn.providerMutability,
    }))
  )
}

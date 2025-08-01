import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'
import { accounts as accountSchema, transactions as trxnSchema } from '../../drizzle/schema'

export async function bulkInsertTinkData(
  accounts: any[],
  transactions: any[],
  customerId: string
) {
  await db
    .insert(accountSchema)
    .values(
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
        balance: account.balanceFormatted,
        identifiers: account.identifiers,
        lastRefreshed: new Date(account.dates.lastRefreshed),
        financialInstitutionId: account.financialInstitutionId,
        customerSegment: account.customerSegment,
      }))
    )
    .onConflictDoUpdate({
      target: accountSchema.id,
      set: {
        customerId: sql`EXCLUDED.customer_id`,
        name: sql`EXCLUDED.name`,
        type: sql`EXCLUDED.type`,
        bookedAmount: sql`EXCLUDED.booked_amount`,
        bookedScale: sql`EXCLUDED.booked_scale`,
        bookedCurrency: sql`EXCLUDED.booked_currency`,
        availableAmount: sql`EXCLUDED.available_amount`,
        availableScale: sql`EXCLUDED.available_scale`,
        availableCurrency: sql`EXCLUDED.available_currency`,
        balance: sql`EXCLUDED.balance`,
        identifiers: sql`EXCLUDED.identifiers`,
        lastRefreshed: sql`EXCLUDED.last_refreshed`,
        financialInstitutionId: sql`EXCLUDED.financial_institution_id`,
        customerSegment: sql`EXCLUDED.customer_segment`,
      },
    })

  await db
    .insert(trxnSchema)
    .values(
      transactions.map((txn: any) => ({
        id: txn.id,
        accountId: txn.accountId,
        customerId,
        amount: txn.amountFormatted,
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
    .onConflictDoUpdate({
      target: trxnSchema.id,
      set: {
        accountId: sql`EXCLUDED.account_id`,
        customerId: sql`EXCLUDED.customer_id`,
        amount: sql`EXCLUDED.amount`,
        unscaledValue: sql`EXCLUDED.unscaled_value`,
        scale: sql`EXCLUDED.scale`,
        currencyCode: sql`EXCLUDED.currency_code`,
        descriptions: sql`EXCLUDED.descriptions`,
        bookedDate: sql`EXCLUDED.booked_date`,
        identifiers: sql`EXCLUDED.identifiers`,
        types: sql`EXCLUDED.types`,
        status: sql`EXCLUDED.status`,
        providerMutability: sql`EXCLUDED.provider_mutability`,
      },
    })
}

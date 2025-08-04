import { db } from '@/lib/db'
import { insertAccounts, insertTransactions } from './db-insert-helper' 
import { accounts as accountSchema, transactions as trxnSchema } from '../../drizzle/schema'

export async function bulkInsertTinkAccounts(
  accounts: any[],
  customerId: string
) {
    await insertAccounts(db, accounts, customerId, accountSchema)
}

export async function bulkInsertTinkTransactions(
  transactions: any[],
  customerId: string
) {
    await insertTransactions(db, transactions, customerId, trxnSchema)
}
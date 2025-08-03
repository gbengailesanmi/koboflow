import { db } from '@/lib/db'
import { insertAccounts, insertTransactions } from './db-insert-helper' 
import { accounts as accountSchema, transactions as trxnSchema } from '../../drizzle/schema'

export async function bulkInsertTinkAccounts(
  accounts: any[],
  customerId: string
) {
  try {
    await insertAccounts(db, accounts, customerId, accountSchema)
  } catch (error) {
    throw new Error('Conflict occurred while inserting accounts.')
  }
}

export async function bulkInsertTinkTransactions(
  transactions: any[],
  customerId: string
) {
  try {
    await insertTransactions(db, transactions, customerId, trxnSchema)
  } catch (error) {
    throw new Error('Conflict occurred while inserting transactions.')
  }
}
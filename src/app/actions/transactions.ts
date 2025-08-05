'use server'

import { db } from '@/lib/db'
import { transactions } from '@/../drizzle/schema'
import { eq, desc } from 'drizzle-orm'

export async function getTransactionsForCustomer(customerId: string) {
  const results = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, customerId))
    .orderBy(desc(transactions.bookedDate))

  console.log('dfdf', results[0])
  return results
}

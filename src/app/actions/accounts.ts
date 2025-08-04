'use server'

import { db } from '@/lib/db'
import { accounts } from '@/../drizzle/schema'
import { eq } from 'drizzle-orm'

export async function getAccountsForCustomer(customerId: string) {
  const results = await db
    .select()
    .from(accounts)
    .where(eq(accounts.customerId, customerId))
  return results
}

import { db } from '@/lib/db'
import { accounts } from '@/../drizzle/schema'
import { transactions } from '@/../drizzle/schema'
import { eq, desc } from 'drizzle-orm'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'


import DashboardClient from '@/app/components/dashboard/DashboardClient'

export default async function PortfolioPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const accountsData = await db
    .select()
    .from(accounts)
    .where(eq(accounts.customerId, user.customerId))

  const transactionsData = await db
    .select()
    .from(transactions)
    .where(eq(transactions.customerId, user.customerId))
    .orderBy(desc(transactions.bookedDate))

  return <DashboardClient accounts={accountsData} transactions={transactionsData} />
}

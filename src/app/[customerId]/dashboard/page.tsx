'use server'

import { getDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

import DashboardClient from '@/app/components/dashboard-client/dashboard-client'

export default async function Dashboard() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await getDb()

  const accountsData = await db
    .collection('accounts')
    .find({ customerId: user.customerId })
    .toArray()

  const transactionsData = await db
    .collection('transactions')
    .find({ customerId: user.customerId })
    .sort({ bookedDate: -1 })
    .toArray()

  return <DashboardClient accounts={accountsData} transactions={transactionsData} />
}

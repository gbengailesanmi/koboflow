'use server'

import { getDb } from '@/lib/db'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import TransactionsPageClient from '@/app/components/transactions-page-client/transactions-page-client'

export default async function TransactionsPage() {
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

  return <TransactionsPageClient accounts={accountsData} transactions={transactionsData} />
}

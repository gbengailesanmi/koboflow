'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import TransactionsPageClient from '@/app/components/transactions/transactions-page-client/transactions-page-client'

export default async function TransactionsPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  if (!db.collection('users').findOne({ customerId: user.customerId })) {
    redirect(`/login`)
  }

  const accountsDataRaw = await db
    .collection('accounts')
    .find({ customerId: user.customerId })
    .toArray()

  const transactionsDataRaw = await db
    .collection('transactions')
    .find({ customerId: user.customerId })
    .sort({ bookedDate: -1 })
    .toArray()

  const accountsData = sanitizeArray(accountsDataRaw)
  const transactionsData = sanitizeArray(transactionsDataRaw)

  return <TransactionsPageClient accounts={accountsData} transactions={transactionsData} />
}

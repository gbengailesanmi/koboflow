'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { sanitizeArray } from '@/lib/sanitize'
import TransactionsPageClient from '@/app/components/transactions/transactions-page-client/transactions-page-client'
import PageLayoutWithSidebar from '@/app/components/page-layout-with-sidebar/page-layout-with-sidebar'
import { PAGE_COLORS } from '@/app/components/page-background/page-colors'

export default async function TransactionsPage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  const userProfile = await db.collection('users').findOne({ customerId: user.customerId })
  
  if (!userProfile) {
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

  // Get page color from user profile or use default
  const pageColor = userProfile?.accentColours?.transactions || PAGE_COLORS.transactions

  return (
    <PageLayoutWithSidebar customerId={user.customerId}>
      <TransactionsPageClient accounts={accountsData} transactions={transactionsData} pageColor={pageColor} />
    </PageLayoutWithSidebar>
  )
}

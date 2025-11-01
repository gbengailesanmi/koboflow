import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getTinkTokens, getTinkAccountsData, getTinkTransactionsData } from '@/app/api/tink'
import { bulkInsertTransactions } from '@/db/helpers/insert-transactions'
import { bulkInsertAccounts } from '@/db/helpers/insert-accounts'
import { recalculateMonthlySpending } from '@/db/helpers/budget-helpers'
import { connectDB } from '@/db/mongo'
// import fs from 'fs'

export async function GET(req: Request) {
  const user = await getSession()

  if (!user) {
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/login`)  
  }

  const code = new URL(req.url).searchParams.get('code')
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  try {
    const accessToken = await getTinkTokens({
      code,
      uriBase: process.env.BASE_URI!,
      port: process.env.PORT!
    })
    
    const accounts = await getTinkAccountsData(accessToken, user.customerId)
    const transactions = await getTinkTransactionsData(accessToken, accounts, user.customerId)

    await bulkInsertAccounts(accounts.accounts, user.customerId, connectDB)
    await bulkInsertTransactions(transactions.transactions, user.customerId, connectDB)
    
    // Recalculate budget spending after syncing transactions
    const now = new Date()
    await recalculateMonthlySpending(user.customerId, now.getFullYear(), now.getMonth())
    
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

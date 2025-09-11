import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getTinkTokens, getTinkAccountsData, getTinkTransactionsData } from '@/app/api/tink'
import { bulkInsertTinkTransactions } from '@/db/helpers/insert-transactions'
import { bulkInsertTinkAccounts } from '@/db/helpers/insert-accounts'
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

    await bulkInsertTinkAccounts(accounts.accounts, user.customerId, connectDB)
    await bulkInsertTinkTransactions(transactions.transactions, user.customerId, connectDB)
    
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

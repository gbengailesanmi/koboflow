import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getTinkTokens, getTinkData } from '@/app/api/tink'
import { bulkInsertTinkAccounts, bulkInsertTinkTransactions } from '@/helpers/db-insert'
// import fs from 'fs'

export async function GET(req: Request) {
  const user = await getSession()

  if (!user) {
    return NextResponse.redirect(`${process.env.BASE_URI}/login`)  
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

    const { accounts, transactions } = await getTinkData(accessToken, user.customerId)

    //   fs.writeFileSync(
    //   './accounts.json',
    //   JSON.stringify(nextPageToken, null, 2),
    //   'utf-8'
    // )

    await bulkInsertTinkAccounts(accounts, user.customerId)
    await bulkInsertTinkTransactions(transactions, user.customerId)
    
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

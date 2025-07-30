import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getTinkTokens, getTinkData } from '@/app/api/tink/tink'
import { accounts as accountSchema, transactions as trxnSchema } from '../../../drizzle/schema'
import { db } from '../../lib/db'

export async function GET(req: Request) {
  const user = await getCurrentUser()

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

       // Bulk insert accounts
    await db.insert(accountSchema).values(
      accounts.map((account: any) => ({
        id: account.id,
        customerId: user.customerId,
        name: account.name,
        type: account.type,
        bookedAmount: parseInt(account.balances.booked.amount.value.unscaledValue, 10),
        bookedScale: parseInt(account.balances.booked.amount.value.scale, 10),
        bookedCurrency: account.balances.booked.amount.currencyCode,
        availableAmount: parseInt(account.balances.available.amount.value.unscaledValue, 10),
        availableScale: parseInt(account.balances.available.amount.value.scale, 10),
        availableCurrency: account.balances.available.amount.currencyCode,
        identifiers: account.identifiers,
        lastRefreshed: new Date(account.dates.lastRefreshed),
        financialInstitutionId: account.financialInstitutionId,
        customerSegment: account.customerSegment,
      }))
    )

    // Bulk insert transactions
    await db.insert(trxnSchema).values(
      transactions.map((txn:any) => ({
        id: txn.id,
        accountId: txn.accountId,
        customerId: user.customerId,
        unscaledValue: parseInt(txn.amount.value.unscaledValue, 10),
        scale: parseInt(txn.amount.value.scale, 10),
        currencyCode: txn.amount.currencyCode,
        descriptions: txn.descriptions,
        bookedDate: new Date(txn.dates.booked),
        identifiers: txn.identifiers,
        types: txn.types,
        status: txn.status,
        providerMutability: txn.providerMutability,
      }))
    )
    
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Failed to fetch data from Tink' }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/session'
import { getTinkTokens, getTinkData } from '@/app/api/tink/tink'
import { bulkInsertTinkData } from '@/helpers/bulkInsertData'

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

    await bulkInsertTinkData(accounts, transactions, user.customerId)
    
    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err }, { status: 500 })
  }
}

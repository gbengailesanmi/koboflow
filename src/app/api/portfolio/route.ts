import { NextResponse } from 'next/server'
import { accountsMock } from '@/mocks/accountsMock'
import { trxnMock } from '@/mocks/trxnMock'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const customerId = url.searchParams.get('customerId')

  const data = {
    accounts: accountsMock,
    transactions: trxnMock.transactions,
  }

  return NextResponse.json(data)
}

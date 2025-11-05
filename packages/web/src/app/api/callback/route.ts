import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
    const response = await fetch(`${API_URL}/api/callback?code=${code}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-customer-id': user.customerId,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(error, { status: response.status })
    }

    return NextResponse.redirect(`${process.env.BASE_URI}:${process.env.PORT}/${user.customerId}/dashboard`)
  } catch (err: any) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

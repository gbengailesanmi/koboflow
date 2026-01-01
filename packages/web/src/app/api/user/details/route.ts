import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/server/get-server-session'
import { getDb } from '@/lib/mongo/mongo'
import { logger } from '@money-mapper/shared'

function maskBVN(bvn?: string): string {
  if (!bvn) return ''
  return `${bvn.slice(0, 3)}****${bvn.slice(-3)}`
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const db = await getDb()
    const user = await db.collection('users').findOne({
      customerId: session.user.customerId,
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const customerDetails = user.customerDetailsFromMono 
      ? {
          ...user.customerDetailsFromMono,
          bvn: maskBVN(user.customerDetailsFromMono.bvn)
        }
      : null

    return NextResponse.json({
      customerDetailsFromMono: customerDetails,
      customerDetailsLastUpdated: user.customerDetailsLastUpdated || null,
    })
  } catch (error) {
    logger.error({ module: 'api-user-details', error }, 'Failed to fetch user details')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

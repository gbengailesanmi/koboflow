import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { logger } from '@money-mapper/shared'
import { getCustomerDetails } from '@/lib/api/api-service'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data = await getCustomerDetails(session.user.customerId)
    return NextResponse.json(data)
  } catch (error: any) {
    logger.error({ module: 'api-user-details', error }, 'Failed to fetch user details')
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

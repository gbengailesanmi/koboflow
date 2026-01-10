import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getAccounts } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-accounts',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const accounts = await getAccounts()
    
    logger.info({ 
      module: 'api-accounts',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: accounts.length
    }, 'Accounts fetched successfully')
    
    return NextResponse.json(accounts)
  } catch (error: any) {
    logger.error({ 
      module: 'api-accounts', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch accounts')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}

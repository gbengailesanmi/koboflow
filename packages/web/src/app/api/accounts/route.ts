import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getAccounts } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  console.log('[API /api/accounts] Request received')
  
  try {
    const session = await getServerSession()
    console.log('[API /api/accounts] Session:', session ? 'exists' : 'missing', 'customerId:', session?.user?.customerId)

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-accounts',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      console.log('[API /api/accounts] Unauthorized - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[API /api/accounts] Calling getAccounts()...')
    const accounts = await getAccounts()
    console.log('[API /api/accounts] getAccounts() returned:', accounts.length, 'accounts')
    
    logger.info({ 
      module: 'api-accounts',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: accounts.length
    }, 'Accounts fetched successfully')
    
    console.log('[API /api/accounts] Returning response with', accounts.length, 'accounts')
    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('[API /api/accounts] Error caught:', {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack
    })
    
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

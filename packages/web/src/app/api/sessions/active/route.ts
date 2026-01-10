import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getActiveSessions } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-sessions',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const result = await getActiveSessions()
    
    logger.info({ 
      module: 'api-sessions',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: result.sessions?.length || 0
    }, 'Active sessions fetched successfully')
    
    return NextResponse.json(result)
  } catch (error: any) {
    logger.error({ 
      module: 'api-sessions', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch active sessions')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}

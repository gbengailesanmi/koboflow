import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getBudgets } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-budgets',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const budgets = await getBudgets()
    
    logger.info({ 
      module: 'api-budgets',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: budgets.length
    }, 'Budgets fetched successfully')
    
    return NextResponse.json(budgets)
  } catch (error: any) {
    logger.error({ 
      module: 'api-budgets', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch budgets')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}

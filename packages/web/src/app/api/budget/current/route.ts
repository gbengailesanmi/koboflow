import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getBudget } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-budget-current',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const budget = await getBudget()
    
    logger.info({ 
      module: 'api-budget-current',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      found: !!budget
    }, 'Current budget fetched successfully')
    
    if (!budget) {
      return NextResponse.json(
        { totalBudgetLimit: 0, categories: [] },
        { status: 200 }
      )
    }
    
    return NextResponse.json({
      totalBudgetLimit: budget.totalBudgetLimit || 0,
      categories: budget.categories || []
    })
  } catch (error: any) {
    logger.error({ 
      module: 'api-budget-current', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch current budget')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}

import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getCustomCategories } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-categories-custom',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const customCategories = await getCustomCategories()
    
    logger.info({ 
      module: 'api-categories-custom',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: customCategories.length
    }, 'Custom categories fetched successfully')
    
    return NextResponse.json(customCategories)
  } catch (error: any) {
    logger.error({ 
      module: 'api-categories-custom', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch custom categories')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}

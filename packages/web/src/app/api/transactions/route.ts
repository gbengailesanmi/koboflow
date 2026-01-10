import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api/get-server-session'
import { getTransactions } from '@/lib/api/api-service'
import { logger } from '@koboflow/shared'

export async function GET() {
  const startTime = Date.now()
  
  try {
    const session = await getServerSession()

    if (!session?.user?.customerId) {
      logger.warn({ 
        module: 'api-transactions',
        duration: Date.now() - startTime
      }, 'Unauthorized - No session or customerId')
      
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const transactions = await getTransactions()
    
    logger.info({ 
      module: 'api-transactions',
      customerId: session.user.customerId,
      duration: Date.now() - startTime,
      count: transactions.length
    }, 'Transactions fetched successfully')
    
    return NextResponse.json(transactions)
  } catch (error: any) {
    logger.error({ 
      module: 'api-transactions', 
      err: error,
      duration: Date.now() - startTime
    }, 'Failed to fetch transactions')
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.statusCode || 500 }
    )
  }
}
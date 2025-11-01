
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { recalculateMonthlySpending } from '@/db/helpers/budget-helpers'

/**
 * POST /api/budget/recalculate
 * Recalculate spending for current month
 * This should be called after transactions are synced
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()

    await recalculateMonthlySpending(session.customerId, year, month)

    return NextResponse.json({ 
      success: true,
      message: 'Spending recalculated successfully' 
    })
  } catch (error) {
    console.error('Error recalculating spending:', error)
    return NextResponse.json(
      { error: 'Failed to recalculate spending' },
      { status: 500 }
    )
  }
}

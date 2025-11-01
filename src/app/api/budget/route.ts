
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getBudget, upsertBudget, getBudgetWithSpending } from '@/db/helpers/budget-helpers'
import type { CategoryBudget } from '@/types/budget'

/**
 * GET /api/budget
 * Fetch budget for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const budget = await getBudgetWithSpending(session.customerId)
    
    if (!budget) {
      // Return default budget if none exists
      return NextResponse.json({
        customerId: session.customerId,
        monthly: 5000,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/budget
 * Create or update budget
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

    const body = await request.json()
    const { monthly, categories } = body

    if (typeof monthly !== 'number' || monthly < 0) {
      return NextResponse.json(
        { error: 'Invalid monthly budget' },
        { status: 400 }
      )
    }

    if (!Array.isArray(categories)) {
      return NextResponse.json(
        { error: 'Invalid categories' },
        { status: 400 }
      )
    }

    // Validate categories
    const validCategories: CategoryBudget[] = categories.filter(cat => 
      cat.category && 
      typeof cat.limit === 'number' && 
      cat.limit >= 0
    )

    await upsertBudget(session.customerId, monthly, validCategories)

    return NextResponse.json({ 
      success: true,
      message: 'Budget updated successfully' 
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/budget
 * Partial update of budget
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const currentBudget = await getBudget(session.customerId)

    if (!currentBudget) {
      return NextResponse.json(
        { error: 'Budget not found. Create one first.' },
        { status: 404 }
      )
    }

    const updatedBudget = {
      monthly: body.monthly ?? currentBudget.monthly,
      categories: body.categories ?? currentBudget.categories
    }

    await upsertBudget(session.customerId, updatedBudget.monthly, updatedBudget.categories)

    return NextResponse.json({ 
      success: true,
      message: 'Budget updated successfully' 
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    return NextResponse.json(
      { error: 'Failed to update budget' },
      { status: 500 }
    )
  }
}

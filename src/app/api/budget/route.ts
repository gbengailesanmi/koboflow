
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getBudget, upsertBudget, getBudgetWithSpending } from '@/db/helpers/budget-helpers'
import type { CategoryBudget, BudgetPeriod } from '@/types/budget'
import { connectDB } from '@/db/mongo'

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
        monthly: 0,
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
    const { monthly, categories, period } = body

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
    
    // Validate period if provided
    let validPeriod: BudgetPeriod | undefined = undefined
    if (period) {
      if (!period.type || !['current-month', 'custom-date', 'recurring'].includes(period.type)) {
        return NextResponse.json(
          { error: 'Invalid period type' },
          { status: 400 }
        )
      }
      
      // Convert date strings to Date objects if present
      if (period.startDate) {
        period.startDate = new Date(period.startDate)
      }
      if (period.endDate) {
        period.endDate = new Date(period.endDate)
      }
      
      validPeriod = period as BudgetPeriod
    }

    // Update budget in budget collection
    await upsertBudget(session.customerId, monthly, validCategories, validPeriod)

    // Sync monthly budget to user profile (Budget page takes precedence)
    const db = await connectDB()
    await db.collection('users').updateOne(
      { customerId: session.customerId },
      { 
        $set: { 
          monthlyBudget: monthly,
          updatedAt: new Date()
        } 
      }
    )

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
      categories: body.categories ?? currentBudget.categories,
      period: body.period ?? currentBudget.period
    }
    
    // Validate and convert period dates if present
    if (updatedBudget.period) {
      if (updatedBudget.period.startDate && typeof updatedBudget.period.startDate === 'string') {
        updatedBudget.period.startDate = new Date(updatedBudget.period.startDate)
      }
      if (updatedBudget.period.endDate && typeof updatedBudget.period.endDate === 'string') {
        updatedBudget.period.endDate = new Date(updatedBudget.period.endDate)
      }
    }

    // Update budget in budget collection
    await upsertBudget(session.customerId, updatedBudget.monthly, updatedBudget.categories, updatedBudget.period)

    // Sync monthly budget to user profile (Budget page takes precedence)
    const db = await connectDB()
    await db.collection('users').updateOne(
      { customerId: session.customerId },
      { 
        $set: { 
          monthlyBudget: updatedBudget.monthly,
          updatedAt: new Date()
        } 
      }
    )

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

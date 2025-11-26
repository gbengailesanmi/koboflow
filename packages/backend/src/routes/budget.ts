import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { getBudget, upsertBudget } from '../db/helpers/budget-helpers'
import type { CategoryBudget, BudgetPeriod } from '@money-mapper/shared'
import { connectDB } from '../db/mongo'

export const budgetRoutes = Router()

budgetRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const budget = await getBudget(customerId)
    
    if (!budget) {
      return res.json({
        customerId,
        totalBudgetLimit: 0,
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }

    res.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
})

budgetRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { totalBudgetLimit, categories, period } = req.body

    if (typeof totalBudgetLimit !== 'number' || totalBudgetLimit < 0) {
      return res.status(400).json({ error: 'Invalid budget limit' })
    }

    if (!Array.isArray(categories)) {
      return res.status(400).json({ error: 'Invalid categories' })
    }

    const validCategories: CategoryBudget[] = categories.filter(cat => 
      cat.category && 
      typeof cat.limit === 'number' && 
      cat.limit >= 0
    )
    
    let validPeriod: BudgetPeriod | undefined = undefined
    if (period) {
      if (!period.type || !['current-month', 'custom-date', 'recurring'].includes(period.type)) {
        return res.status(400).json({ error: 'Invalid period type' })
      }
      
      if (period.startDate) {
        period.startDate = new Date(period.startDate)
      }
      if (period.endDate) {
        period.endDate = new Date(period.endDate)
      }
      
      validPeriod = period as BudgetPeriod
    }

    await upsertBudget(customerId, totalBudgetLimit, validCategories, validPeriod)

    const db = await connectDB()
    await db.collection('users').updateOne(
      { customerId },
      { 
        $set: { 
          totalBudgetLimit: totalBudgetLimit,
          updatedAt: new Date()
        } 
      }
    )

    res.json({ 
      success: true,
      message: 'Budget updated successfully' 
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

budgetRoutes.patch('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const currentBudget = await getBudget(customerId)

    if (!currentBudget) {
      return res.status(404).json({ error: 'Budget not found. Create one first.' })
    }

    const updatedBudget = {
      totalBudgetLimit: req.body.totalBudgetLimit ?? currentBudget.totalBudgetLimit,
      categories: req.body.categories ?? currentBudget.categories,
      period: req.body.period ?? currentBudget.period
    }
    
    if (updatedBudget.period) {
      if (updatedBudget.period.startDate && typeof updatedBudget.period.startDate === 'string') {
        updatedBudget.period.startDate = new Date(updatedBudget.period.startDate)
      }
      if (updatedBudget.period.endDate && typeof updatedBudget.period.endDate === 'string') {
        updatedBudget.period.endDate = new Date(updatedBudget.period.endDate)
      }
    }

    await upsertBudget(customerId, updatedBudget.totalBudgetLimit, updatedBudget.categories, updatedBudget.period)

    const db = await connectDB()
    await db.collection('users').updateOne(
      { customerId },
      { 
        $set: { 
          totalBudgetLimit: updatedBudget.totalBudgetLimit,
          updatedAt: new Date()
        } 
      }
    )

    res.json({ 
      success: true,
      message: 'Budget updated successfully' 
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

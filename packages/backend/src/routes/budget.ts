import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { 
  getBudgets, 
  getActiveBudget, 
  getBudgetById,
  createBudget,
  updateBudgetById,
  setActiveBudget,
  deleteBudget,
  upsertBudget,
  getBudget 
} from '../db/helpers/budget-helpers'
import type { CategoryBudget, BudgetPeriod } from '@money-mapper/shared'
import { connectDB } from '../db/mongo'

export const budgetRoutes = Router()

budgetRoutes.get('/all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const budgets = await getBudgets(customerId)
    res.json({ success: true, budgets })
  } catch (error) {
    console.error('Error fetching budgets:', error)
    res.status(500).json({ error: 'Failed to fetch budgets' })
  }
})

budgetRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const budget = await getActiveBudget(customerId)
    
    if (!budget) {
      return res.json({
        customerId,
        name: 'My Budget',
        isActive: true,
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

budgetRoutes.get('/:budgetId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    const { budgetId } = req.params
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const budget = await getBudgetById(customerId, budgetId)
    
    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    res.json(budget)
  } catch (error) {
    console.error('Error fetching budget:', error)
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
})

budgetRoutes.post('/create', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, totalBudgetLimit, categories, period, setAsActive } = req.body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Budget name is required' })
    }

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

    const budgetId = await createBudget(
      customerId, 
      name, 
      totalBudgetLimit, 
      validCategories, 
      validPeriod,
      setAsActive
    )

    res.json({ 
      success: true,
      message: 'Budget created successfully',
      budgetId
    })
  } catch (error: any) {
    console.error('Error creating budget:', error)
    
    if (error.message === 'Maximum of 10 budgets allowed per user') {
      return res.status(400).json({ error: error.message })
    }
    
    res.status(500).json({ error: 'Failed to create budget' })
  }
})

budgetRoutes.put('/:budgetId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    const { budgetId } = req.params
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const updates: any = {}
    
    if (req.body.name !== undefined) {
      if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
        return res.status(400).json({ error: 'Invalid budget name' })
      }
      updates.name = req.body.name
    }
    
    if (req.body.totalBudgetLimit !== undefined) {
      if (typeof req.body.totalBudgetLimit !== 'number' || req.body.totalBudgetLimit < 0) {
        return res.status(400).json({ error: 'Invalid budget limit' })
      }
      updates.totalBudgetLimit = req.body.totalBudgetLimit
    }
    
    if (req.body.categories !== undefined) {
      if (!Array.isArray(req.body.categories)) {
        return res.status(400).json({ error: 'Invalid categories' })
      }
      updates.categories = req.body.categories.filter((cat: any) => 
        cat.category && 
        typeof cat.limit === 'number' && 
        cat.limit >= 0
      )
    }
    
    if (req.body.period !== undefined) {
      if (req.body.period.startDate) {
        req.body.period.startDate = new Date(req.body.period.startDate)
      }
      if (req.body.period.endDate) {
        req.body.period.endDate = new Date(req.body.period.endDate)
      }
      updates.period = req.body.period
    }

    await updateBudgetById(customerId, budgetId, updates)

    res.json({ 
      success: true,
      message: 'Budget updated successfully' 
    })
  } catch (error) {
    console.error('Error updating budget:', error)
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

budgetRoutes.post('/:budgetId/activate', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    const { budgetId } = req.params
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await setActiveBudget(customerId, budgetId)

    res.json({ 
      success: true,
      message: 'Budget activated successfully' 
    })
  } catch (error) {
    console.error('Error activating budget:', error)
    res.status(500).json({ error: 'Failed to activate budget' })
  }
})

budgetRoutes.delete('/:budgetId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    const { budgetId } = req.params
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    await deleteBudget(customerId, budgetId)

    res.json({ 
      success: true,
      message: 'Budget deleted successfully' 
    })
  } catch (error: any) {
    console.error('Error deleting budget:', error)
    
    if (error.message === 'Budget not found') {
      return res.status(404).json({ error: error.message })
    }
    
    res.status(500).json({ error: 'Failed to delete budget' })
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

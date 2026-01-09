import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { logger } from '@koboflow/shared'
import {
  getBudgets,
  getActiveBudget,
  getBudgetById,
  createBudget,
  updateBudgetById,
  setActiveBudget,
  deleteBudget,
  upsertBudget,
  getBudget,
} from '../db/helpers/budget-helpers'
import type { CategoryBudget, BudgetPeriod } from '@koboflow/shared'
import { connectDB } from '../db/mongo'

export const budgetRoutes = Router()

// ---------------------------------- GET ALL ---------------------------------- //
budgetRoutes.get('/all', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const budgets = await getBudgets(customerId)
    res.json({ success: true, budgets })
  } catch (error) {
    logger.error({ module: 'budget-routes', error }, 'Failed to fetch budgets')
    res.status(500).json({ error: 'Failed to fetch budgets' })
  }
})

// ---------------------------------- GET ACTIVE ---------------------------------- //
budgetRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const budget = await getActiveBudget(customerId)

    const responseData = budget || {
      customerId,
      name: 'My Budget',
      isActive: true,
      totalBudgetLimit: 0,
      categories: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    res.json(responseData)
  } catch (error) {
    logger.error({ module: 'budget-routes', error }, 'Failed to fetch active budget')
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
})

// ---------------------------------- GET BY ID ---------------------------------- //
budgetRoutes.get('/:budgetId', requireAuth, async (req, res) => {
  try {
    const { budgetId } = req.params
    const customerId = req.user!.customerId

    const budget = await getBudgetById(customerId, budgetId)

    if (!budget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    res.json(budget)
  } catch (error) {
    logger.error({ module: 'budget-routes', budgetId: req.params.budgetId, error }, 'Failed to fetch budget by ID')
    res.status(500).json({ error: 'Failed to fetch budget' })
  }
})

// ---------------------------------- CREATE ---------------------------------- //
budgetRoutes.post('/create', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const { name, totalBudgetLimit, categories, period, setAsActive } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Budget name is required' })
    }

    if (typeof totalBudgetLimit !== 'number' || totalBudgetLimit < 0) {
      return res.status(400).json({ error: 'Invalid budget limit' })
    }

    const validCategories: CategoryBudget[] = Array.isArray(categories)
      ? categories.filter(
          (c) => c.category && typeof c.limit === 'number' && c.limit >= 0
        )
      : []

    let validPeriod: BudgetPeriod | undefined
    if (period) {
      validPeriod = {
        ...period,
        startDate: period.startDate ? new Date(period.startDate) : undefined,
        endDate: period.endDate ? new Date(period.endDate) : undefined,
      }
    }

    const budgetId = await createBudget(
      customerId,
      name,
      totalBudgetLimit,
      validCategories,
      validPeriod,
      setAsActive
    )

    res.json({ success: true, budgetId })
  } catch (error: any) {
    logger.error({ module: 'budget-routes', error }, 'Failed to create budget')
    res.status(500).json({ error: error.message ?? 'Failed to create budget' })
  }
})

// ---------------------------------- UPDATE ---------------------------------- //
budgetRoutes.put('/:budgetId', requireAuth, async (req, res) => {
  try {
    const { budgetId } = req.params
    const customerId = req.user!.customerId

    const updates: any = {}

    if (req.body.name !== undefined) updates.name = req.body.name
    if (req.body.totalBudgetLimit !== undefined)
      updates.totalBudgetLimit = req.body.totalBudgetLimit
    if (req.body.categories !== undefined) updates.categories = req.body.categories
    if (req.body.period !== undefined) {
      updates.period = {
        ...req.body.period,
        startDate: req.body.period.startDate
          ? new Date(req.body.period.startDate)
          : undefined,
        endDate: req.body.period.endDate
          ? new Date(req.body.period.endDate)
          : undefined,
      }
    }

    await updateBudgetById(customerId, budgetId, updates)
    res.json({ success: true })
  } catch (error) {
    logger.error({ module: 'budget-routes', budgetId: req.params.budgetId, error }, 'Failed to update budget')
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

// ---------------------------------- ACTIVATE ---------------------------------- //
budgetRoutes.post('/:budgetId/activate', requireAuth, async (req, res) => {
  try {
    const { budgetId } = req.params
    await setActiveBudget(req.user!.customerId, budgetId)
    res.json({ success: true })
  } catch (error) {
    logger.error({ module: 'budget-routes', budgetId: req.params.budgetId, error }, 'Failed to activate budget')
    res.status(500).json({ error: 'Failed to activate budget' })
  }
})

// ---------------------------------- DELETE ---------------------------------- //
budgetRoutes.delete('/:budgetId', requireAuth, async (req, res) => {
  try {
    const { budgetId } = req.params
    await deleteBudget(req.user!.customerId, budgetId)
    res.json({ success: true })
  } catch (error: any) {
    logger.error({ module: 'budget-routes', budgetId: req.params.budgetId, error }, 'Failed to delete budget')
    res.status(500).json({ error: error.message ?? 'Failed to delete budget' })
  }
})

// ---------------------------------- UPSERT (PATCH) ---------------------------------- //
budgetRoutes.patch('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const currentBudget = await getBudget(customerId)

    if (!currentBudget) {
      return res.status(404).json({ error: 'Budget not found' })
    }

    const updated = {
      totalBudgetLimit:
        req.body.totalBudgetLimit ?? currentBudget.totalBudgetLimit,
      categories: req.body.categories ?? currentBudget.categories,
      period: req.body.period ?? currentBudget.period,
    }

    await upsertBudget(customerId, updated.totalBudgetLimit, updated.categories, updated.period)

    const db = await connectDB()
    await db.collection('users').updateOne(
      { customerId },
      { $set: { totalBudgetLimit: updated.totalBudgetLimit, updatedAt: new Date() } }
    )

    res.json({ success: true })
  } catch (error) {
    logger.error({ module: 'budget-routes', error }, 'Failed to update budget (PATCH)')
    res.status(500).json({ error: 'Failed to update budget' })
  }
})

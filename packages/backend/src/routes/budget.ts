import { Router } from 'express'

export const budgetRoutes = Router()

// TODO: Migrate budget logic from Next.js API routes
budgetRoutes.get('/', async (req, res) => {
  res.json({ message: 'Get budget endpoint - to be implemented' })
})

budgetRoutes.post('/', async (req, res) => {
  res.json({ message: 'Create/Update budget endpoint - to be implemented' })
})

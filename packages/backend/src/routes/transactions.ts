import { Router } from 'express'

export const transactionRoutes = Router()

// TODO: Implement transaction endpoints
transactionRoutes.get('/', async (req, res) => {
  res.json({ message: 'Get transactions endpoint - to be implemented' })
})

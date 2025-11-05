import { Router } from 'express'

export const categoryRoutes = Router()

// TODO: Migrate custom categories logic from Next.js API routes
categoryRoutes.get('/', async (req, res) => {
  res.json({ message: 'Get categories endpoint - to be implemented' })
})

categoryRoutes.post('/', async (req, res) => {
  res.json({ message: 'Create category endpoint - to be implemented' })
})

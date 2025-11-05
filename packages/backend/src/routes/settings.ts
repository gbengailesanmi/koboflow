import { Router } from 'express'

export const settingsRoutes = Router()

// TODO: Migrate settings logic from Next.js API routes
settingsRoutes.get('/', async (req, res) => {
  res.json({ message: 'Get settings endpoint - to be implemented' })
})

settingsRoutes.post('/', async (req, res) => {
  res.json({ message: 'Update settings endpoint - to be implemented' })
})

settingsRoutes.delete('/account', async (req, res) => {
  res.json({ message: 'Delete account endpoint - to be implemented' })
})

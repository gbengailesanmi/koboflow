import dotenv from 'dotenv'

// Load environment variables FIRST before any other imports
dotenv.config()

import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { authRoutes } from './routes/auth'
import { budgetRoutes } from './routes/budget'
import { transactionRoutes } from './routes/transactions'
import { accountRoutes } from './routes/accounts'
import { settingsRoutes } from './routes/settings'
import { categoryRoutes } from './routes/categories'
import { sessionRoutes } from './routes/session'
import { callbackRoutes } from './routes/callback'

const app: Express = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/callback', callbackRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoryRoutes)

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`)
  })
}

export default app

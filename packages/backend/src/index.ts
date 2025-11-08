import dotenv from 'dotenv'

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

const allowedOrigins = (process.env.ALLOWED_ORIGINS)?.split(',').map(o => o.trim()) || ['http://localhost:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-customer-id'],
  exposedHeaders: ['set-cookie'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}))

app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req: Request, res: Response, next: any) => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`)
  })
  
  next()
})

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authRoutes)
app.use('/api/session', sessionRoutes)
app.use('/api/callback', callbackRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoryRoutes)

app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on port ${PORT}`)
  })
}

export default app

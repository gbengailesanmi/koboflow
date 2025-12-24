import dotenv from 'dotenv'

dotenv.config()

import config from './config'
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
import { monoRoutes } from './routes/mono'
import { cleanupExpiredSessions } from './services/session'

const app: Express = express()
const BACKEND_PORT = config.BACKEND_PORT

setInterval(async () => {
  try {
    const deletedCount = await cleanupExpiredSessions()
    console.log(`[Cleanup] Removed ${deletedCount} expired sessions`)
  } catch (error) {
    console.error('[Cleanup] Failed to clean up expired sessions:', error)
  }
}, 60 * 60 * 1000) // 1 hour in milliseconds

cleanupExpiredSessions()
  .then(count => console.log(`[Startup] Cleaned up ${count} expired sessions`))
  .catch(err => console.error('[Startup] Failed to clean up sessions:', err))

const allowedOrigins = config.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000']

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

app.use('/api/mono/webhook', express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf.toString()
  }
}))

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
app.use('/api/mono', monoRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoryRoutes)

app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: config.IS_PRODUCTION ? undefined : err.message
  })
})

app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Backend server running on port ${BACKEND_PORT}`)
  console.log(`🧪 Test Mode: ${!config.IS_PRODUCTION ? 'ENABLED ✅' : 'DISABLED ❌'}`)
  if (!config.IS_PRODUCTION) {
    console.log(`   → Account numbers will be normalized for testing`)
  }
})

import dotenv from 'dotenv'
dotenv.config()

import config from './config'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// routes
import { authRoutes } from './routes/auth'
import { budgetRoutes } from './routes/budget'
import { transactionRoutes } from './routes/transactions'
import { accountRoutes } from './routes/accounts'
import { settingsRoutes } from './routes/settings'
import { categoryRoutes } from './routes/categories'
import { monoRoutes } from './routes/mono'

const app: Express = express()
const BACKEND_PORT = config.BACKEND_PORT

// -----------------------------------------------------------------------------
// CORS — MUST allow credentials
// -----------------------------------------------------------------------------
const allowedOrigins =
  config.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) ?? [
    'http://localhost:3000',
  ]

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, // 👈 REQUIRED FOR COOKIES
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// -----------------------------------------------------------------------------
// Webhook raw body (Mono) — MUST come BEFORE express.json
// -----------------------------------------------------------------------------
app.use(
  '/api/mono/webhook',
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString()
    },
  })
)

// -----------------------------------------------------------------------------
// Body + cookie parsing (ORDER MATTERS)
// -----------------------------------------------------------------------------
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser()) // 👈 THIS WAS THE MISSING RUNTIME PIECE

// -----------------------------------------------------------------------------
// Request logging
// -----------------------------------------------------------------------------
app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on('finish', () => {
    console.log(
      `[${req.method}] ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`
    )
  })
  next()
})

// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// -----------------------------------------------------------------------------
// Routes (AFTER cookieParser)
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes)
app.use('/api/mono', monoRoutes)
app.use('/api/budget', budgetRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/categories', categoryRoutes)

// -----------------------------------------------------------------------------
// Error handler
// -----------------------------------------------------------------------------
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error(err)
  res.status(500).json({
    error: 'Something went wrong',
    message: config.IS_PRODUCTION ? undefined : err.message,
  })
})

// -----------------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------------
app.listen(BACKEND_PORT, () => {
  console.log(`🚀 Backend running on port ${BACKEND_PORT}`)
})
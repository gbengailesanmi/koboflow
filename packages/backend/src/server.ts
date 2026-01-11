///Users/gbenga.ilesanmi/Github/PD/koboflow/packages/backend/src/server.ts
import dotenv from 'dotenv'
dotenv.config()

import config from './config'
import express, { Express, Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { logger } from '@koboflow/shared'
import { verifySignature } from './middleware/signature-verifier'
import { etagMiddleware } from './middleware/etag'

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
app.set('trust proxy', 1) // Trust first proxy

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
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-api-signature'],
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
app.use(cookieParser())

// -----------------------------------------------------------------------------
// Request logging
// -----------------------------------------------------------------------------
app.use((req: Request, res: Response, next) => {
  const start = Date.now()
  res.on('finish', () => {
    logger.info(
      { module: 'server', method: req.method, path: req.path, statusCode: res.statusCode, duration: `${Date.now() - start}ms` },
      'HTTP request completed'
    )
  })
  next()
})

// -----------------------------------------------------------------------------
// ETag middleware - Apply to all GET requests
// -----------------------------------------------------------------------------
app.use(etagMiddleware)


// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// -----------------------------------------------------------------------------
app.use('/api', verifySignature)
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
  logger.error({ module: 'server', err }, 'Server error occurred')
  res.status(500).json({
    error: 'Something went wrong',
    message: config.IS_PRODUCTION ? undefined : err.message,
  })
})

// -----------------------------------------------------------------------------
// Boot
// -----------------------------------------------------------------------------
app.listen(BACKEND_PORT, () => {
  logger.info({ module: '[server]', port: BACKEND_PORT }, 'Server started')
})
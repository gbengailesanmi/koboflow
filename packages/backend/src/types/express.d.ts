// src/types/express.d.ts
import 'express'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string
        customerId: string
        email: string
        firstName?: string
        lastName?: string
      }
    }
  }
}

export {}

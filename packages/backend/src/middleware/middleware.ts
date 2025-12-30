// packages/backend/src/middleware/middleware.ts
import type { Request, Response, NextFunction } from 'express'
import fetch from 'node-fetch'

export interface AuthRequest extends Request {
  user?: {
    userId: string          // ← REQUIRED to satisfy existing contract
    customerId: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const cookieHeader = req.headers.cookie
    if (!cookieHeader) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    const authRes = await fetch(
      `${process.env.WEB_URL}/api/auth/session`,
      {
        headers: { cookie: cookieHeader },
      }
    )

    if (!authRes.ok) {
      return res.status(401).json({ error: 'Invalid session' })
    }

    const session = await authRes.json()

    if (!session?.user?.customerId || !session?.user?.email) {
      return res.status(401).json({ error: 'Invalid session payload' })
    }

    req.user = {
      userId: session.user.customerId,
      customerId: session.user.customerId,
      email: session.user.email,
      firstName: session.user.name?.split(' ')[0],
      lastName: session.user.name?.split(' ').slice(1).join(' '),
    }

    next()
  } catch (error) {
    console.error('[Auth middleware]', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

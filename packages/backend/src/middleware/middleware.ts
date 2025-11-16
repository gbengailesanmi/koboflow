import { Request, Response, NextFunction } from 'express'
import { getSession } from '../services/session'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    customerId: string
    email: string
    firstName?: string
    lastName?: string
  }
  sessionId?: string
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get session ID from cookie
    const sessionId = req.cookies?.['session-id']

    if (!sessionId) {
      return res.status(401).json({ error: "Authentication required" })
    }

    // Lookup session in database
    const session = await getSession(sessionId)

    if (!session) {
      return res.status(401).json({ error: "Invalid or expired session" })
    }

    // Attach session data to request
    req.user = {
      userId: session.customerId, // Using customerId as userId for consistency
      customerId: session.customerId,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName
    }
    req.sessionId = sessionId

    next()
  } catch (err) {
    console.error("Auth error:", err)
    return res.status(401).json({ error: "Authentication failed" })
  }
}

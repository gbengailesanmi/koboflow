import { Request, Response, NextFunction } from 'express'
import { verify } from 'jsonwebtoken'
import { connectDB } from '../db/mongo.js'

export interface AuthRequest extends Request {
  user?: {
    userId: string
    customerId: string
    email: string
    firstName?: string
    lastName?: string
  }
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for x-customer-id header (from Next.js API proxy)
    const customerIdHeader = req.headers['x-customer-id'] as string
    
    if (customerIdHeader) {
      // Fetch user from DB using customerId
      const db = await connectDB()
      const user = await db.collection('users').findOne({ customerId: customerIdHeader })
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' })
      }
      
      req.user = {
        userId: user._id.toString(),
        customerId: user.customerId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
      
      return next()
    }

    // Fallback to JWT token authentication
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.cookies?.token

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    // Verify JWT token
    const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = verify(token, secret) as {
      userId: string
      customerId: string
      email: string
    }

    // Optionally fetch user details from DB
    try {
      const db = await connectDB()
      const user = await db.collection('users').findOne({ customerId: decoded.customerId })
      if (user) {
        req.user = {
          ...decoded,
          firstName: user.firstName,
          lastName: user.lastName
        }
      } else {
        req.user = decoded
      }
    } catch (err) {
      console.error('Error fetching user details:', err)
      req.user = decoded
    }

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

// Optional auth middleware (doesn't fail if no token)
export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.cookies?.token

    if (token) {
      const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
      if (secret) {
        const decoded = verify(token, secret) as {
          userId: string
          customerId: string
          email: string
        }
        req.user = decoded
      }
    }
    next()
  } catch (error) {
    // Continue without auth if token is invalid
    next()
  }
}

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

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : req.cookies?.["auth-token"]

    if (!token) {
      return res.status(401).json({ error: "Authentication required" })
    }

    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error("JWT_SECRET not configured")

    const decoded = verify(token, secret) as {
      userId: string
      customerId: string
      email: string
    }

    const db = await connectDB()
    const user = await db.collection("users").findOne({ customerId: decoded.customerId })

    if (!user) {
      return res.status(401).json({ error: "User no longer exists" })
    }

    req.user = {
      userId: user._id.toString(),
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    }

    next()
  } catch (err) {
    console.error("Auth error:", err)
    return res.status(401).json({ error: "Invalid or expired token" })
  }
}

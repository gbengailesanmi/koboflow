/// packages/backend/src/middleware/middleware.ts
import type { Request, Response, NextFunction } from 'express'
import { getToken } from 'next-auth/jwt'

console.log('Middleware loaded', process.env.NEXTAUTH_SECRET)

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    req.user = {
      userId: token.sub as string,
      customerId: token.customerId as string,
      email: token.email as string,
      firstName: token.firstName as string,
      lastName: token.lastName as string,
    }

    next()
  } catch (err) {
    console.error('[Auth middleware]', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

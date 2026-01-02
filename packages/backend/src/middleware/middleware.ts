/// packages/backend/src/middleware/middleware.ts
import type { Request, Response, NextFunction } from 'express'
import { getToken } from 'next-auth/jwt'
import { logger } from '@money-mapper/shared'

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    console.log('🔐 [Auth Middleware] Checking authentication', {
      path: req.path,
      cookies: Object.keys(req.cookies || {}),
      hasCookieHeader: !!req.headers.cookie,
    })

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    })

    console.log('🎫 [Auth Middleware] Token result', {
      hasToken: !!token,
      customerId: token?.customerId,
      email: token?.email,
    })

    if (!token) {
      console.log('❌ [Auth Middleware] No token found - returning 401')
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    req.user = {
      userId: token.sub as string,
      customerId: token.customerId as string,
      email: token.email as string,
      firstName: token.firstName as string,
      lastName: token.lastName as string,
    }

    console.log('✅ [Auth Middleware] Authentication successful', {
      customerId: req.user.customerId,
    })

    next()
  } catch (err) {
    console.error('💥 [Auth Middleware] Error:', err)
    logger.error({ module: 'auth-middleware', err }, 'Authentication failed')
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

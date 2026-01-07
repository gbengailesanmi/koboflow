/// packages/backend/src/middleware/middleware.ts
import type { Request, Response, NextFunction } from 'express'
import { getToken } from 'next-auth/jwt'
import { logger } from '@money-mapper/shared'
import { connectDB } from '../db/mongo'

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

    const isProd = process.env.NODE_ENV === 'production'
    const cookieName = isProd 
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'

    console.log('🍪 [Auth Middleware] Looking for cookie', { cookieName, isProd })

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: isProd,
      cookieName,
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

    const sessionId = token.sessionId as string | undefined
    
    if (sessionId) {
      console.log('🔍 [Auth Middleware] Validating session in database', { sessionId })
      
      const db = await connectDB()
      const session = await db.collection('sessions').findOne({
        sessionId,
        customerId: token.customerId as string,
      })

      if (!session) {
        console.log('❌ [Auth Middleware] Session not found in database')
        return res.status(401).json({ error: 'Session not found' })
      }

      if (session.status !== 'active') {
        console.log('❌ [Auth Middleware] Session revoked', { status: session.status })
        return res.status(401).json({ error: 'Session revoked' })
      }

      if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
        console.log('❌ [Auth Middleware] Session expired')
        return res.status(401).json({ error: 'Session expired' })
      }

      await db.collection('sessions').updateOne(
        { sessionId },
        { $set: { 'metadata.lastActivity': new Date() } }
      )

      console.log('✅ [Auth Middleware] Session validated successfully')
    } else {
      console.log('⚠️ [Auth Middleware] No sessionId in token (legacy session)')
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

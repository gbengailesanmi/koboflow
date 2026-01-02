import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config'

const KEY = config.API_KEY

if (!KEY) {
  console.error('🔴 INTERNAL_API_SECRET is not set! Signature verification will fail.')
}

interface InternalTokenPayload {
  iss: string // Issuer
  aud: string // audience
  iat: number
  exp: number
}

export function verifySignature(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const signature = req.headers['x-internal-api-signature'] as string

  // Log all requests for debugging
  console.log('🔒 [Signature Verifier]', {
    path: req.path,
    method: req.method,
    hasSignature: !!signature,
    ip: req.ip,
  })

  if (!signature) {
    console.log('❌ [Signature Verifier] Missing X-Internal-Signature header')
    res.status(403).json({
      error: 'Forbidden',
      message: 'Direct backend access is not allowed',
    })
    return
  }

  if (!KEY) {
    console.error('🔴 [Signature Verifier] INTERNAL_API_SECRET not configured')
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Server configuration error',
    })
    return
  }

  try {
    const decoded = jwt.verify(signature, KEY, {
      algorithms: ['HS256'],
      audience: 'money-mapper-backend',
      issuer: 'money-mapper-web',
    }) as InternalTokenPayload

    console.log('✅ [Signature Verifier] Valid signature', {
      path: req.path,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    })

    // Signature is valid, proceed
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('⏰ [Signature Verifier] Expired token', {
        path: req.path,
        expiredAt: error.expiredAt,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Request signature expired',
      })
      return
    }

    if (error instanceof jwt.JsonWebTokenError) {
      console.log('🚫 [Signature Verifier] Invalid token', {
        path: req.path,
        error: error.message,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    }

    console.error('❌ [Signature Verifier] Verification error', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify request signature',
    })
  }
}

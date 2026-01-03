import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import config from '../config'
import { connectDB } from '../db/mongo'

const MAX_TOKEN_LIFETIME = 5 * 60
const KEY = config.API_KEY
const EXEMPT_PATHS = [
  '/auth/oauth/google',
  '/auth/oauth/callback',
]
const USED_TOKENS_COLLECTION = 'used_jwt_tokens'
let indexCreated = false

async function ensureTokenIndexes() {
  if (indexCreated) return
  
  const db = await connectDB()
  await db.collection(USED_TOKENS_COLLECTION).createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )
  await db.collection(USED_TOKENS_COLLECTION).createIndex(
    { jti: 1 },
    { unique: true }
  )
  
  indexCreated = true
}

ensureTokenIndexes().catch(err => {
  console.error('❌ Failed to create token indexes:', err)
})

if (!KEY) {
  console.error('🔴 API_KEY is not set! Signature verification will fail.')
}

interface InternalTokenPayload {
  iss: string // Issuer
  aud: string // Audience
  iat: number
  exp: number
  jti: string
  method?: string
  path?: string
  bodyHash?: string
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
}

export async function verifySignature(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (EXEMPT_PATHS.includes(req.path)) {
    return next()
  }

  const signature = req.headers['x-internal-api-signature'] as string

  console.log('🔒 [Signature Verifier]', {
    path: req.path,
    method: req.method,
    hasSignature: !!signature,
    ip: req.ip,
  })

  if (!KEY) {
    console.error('❌ [Signature Verifier] API_KEY not configured - REJECTING REQUEST')
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Server configuration error',
    })
    return
  }

  if (!signature) {
    console.log('❌ [Signature Verifier] Missing X-Internal-API-Signature header')
    res.status(403).json({
      error: 'Forbidden',
      message: 'Direct backend access is not allowed',
    })
    return
  }

  try {
    const decoded = jwt.verify(signature, KEY, {
      algorithms: ['HS256'],
      audience: 'money-mapper-backend',
      issuer: 'money-mapper-web',
    }) as InternalTokenPayload

    const tokenLifetime = decoded.exp - decoded.iat
    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      console.log('⏱️ [Signature Verifier] Token lifetime too long', {
        path: req.path,
        lifetime: tokenLifetime,
        maxAllowed: MAX_TOKEN_LIFETIME,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    }

    if (decoded.jti) {
      const db = await connectDB()
      const existingToken = await db.collection(USED_TOKENS_COLLECTION).findOne({
        jti: decoded.jti
      })

      if (existingToken) {
        console.log('🔁 [Signature Verifier] Token replay detected', {
          path: req.path,
          jti: decoded.jti,
        })
        res.status(403).json({
          error: 'Forbidden',
          message: 'Token has already been used',
        })
        return
      }

      try {
        await db.collection(USED_TOKENS_COLLECTION).insertOne({
          jti: decoded.jti,
          usedAt: new Date(),
          expiresAt: new Date(decoded.exp * 1000),
          path: req.path,
          method: req.method,
        })
      } catch (err: any) {
        if (err.code === 11000) {
          console.log('🔁 [Signature Verifier] Token replay detected (race condition)', {
            path: req.path,
            jti: decoded.jti,
          })
          res.status(403).json({
            error: 'Forbidden',
            message: 'Token has already been used',
          })
          return
        }
        throw err
      }
    }

    if (decoded.method && decoded.method !== req.method) {
      console.log('🚫 [Signature Verifier] Method mismatch', {
        expected: decoded.method,
        actual: req.method,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    }

    if (decoded.path && decoded.path !== req.path) {
      console.log('🚫 [Signature Verifier] Path mismatch', {
        expected: decoded.path,
        actual: req.path,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    }

    if (decoded.bodyHash && req.body) {
      const bodyStr = JSON.stringify(req.body)
      const actualHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
      
      if (!secureCompare(actualHash, decoded.bodyHash)) {
        console.log('🚫 [Signature Verifier] Body hash mismatch', {
          path: req.path,
        })
        res.status(403).json({
          error: 'Forbidden',
          message: 'Request body has been tampered with',
        })
        return
      }
    }

    console.log('✅ [Signature Verifier] Valid signature', {
      path: req.path,
      jti: decoded.jti,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    })

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
    return // CRITICAL: Added missing return statement
  }
}

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import config from '../config'
import { connectDB } from '../db/mongo'

const MAX_TOKEN_LIFETIME = 5 * 60
const KEY = config.API_KEY
const EXEMPT_PATHS = [
  '/api/auth/oauth/google',
  '/api/auth/verify-email',
  '/api/auth/resend-verification',
  '/api/auth/signup',
  '/api/auth/oauth/callback',
  '/api/auth/validate-credentials'
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
  // Use originalUrl to get the full path including mount points
  // Parse to remove query string if present
  const fullPath = req.originalUrl.split('?')[0]
  
  console.log('🔍 [Signature Verifier] Request received', {
    path: req.path,
    originalUrl: req.originalUrl,
    fullPath,
    method: req.method,
    ip: req.ip,
    headers: Object.keys(req.headers),
  })

  if (EXEMPT_PATHS.includes(fullPath)) {
    console.log('⏭️ [Signature Verifier] Path is exempt from verification', { path: fullPath })
    return next()
  }

  const signature = req.headers['x-internal-api-signature'] as string

  console.log('🔒 [Signature Verifier] Checking signature', {
    path: req.path,
    fullPath,
    method: req.method,
    hasSignature: !!signature,
    signatureLength: signature?.length,
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
    console.log('🔓 [Signature Verifier] Attempting to decode token')

    const decoded = jwt.verify(signature, KEY, {
      algorithms: ['HS256'],
      audience: 'money-mapper-backend',
      issuer: 'money-mapper-web',
    }) as InternalTokenPayload

    console.log('✅ [Signature Verifier] Token decoded successfully', {
      jti: decoded.jti,
      iat: decoded.iat,
      exp: decoded.exp,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
      hasMethod: !!decoded.method,
      hasPath: !!decoded.path,
      hasBodyHash: !!decoded.bodyHash,
    })

    const tokenLifetime = decoded.exp - decoded.iat
    console.log('⏱️ [Signature Verifier] Checking token lifetime', {
      lifetime: tokenLifetime,
      maxAllowed: MAX_TOKEN_LIFETIME,
      isValid: tokenLifetime <= MAX_TOKEN_LIFETIME,
    })

    if (tokenLifetime > MAX_TOKEN_LIFETIME) {
      console.log('⏱️ [Signature Verifier] Token lifetime too long', {
        path: fullPath,
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
      console.log('🔍 [Signature Verifier] Checking for token replay', { jti: decoded.jti })

      const db = await connectDB()
      const existingToken = await db.collection(USED_TOKENS_COLLECTION).findOne({
        jti: decoded.jti
      })

      if (existingToken) {
        console.log('🔁 [Signature Verifier] Token replay detected', {
          path: fullPath,
          jti: decoded.jti,
          previouslyUsedAt: existingToken.usedAt,
        })
        res.status(403).json({
          error: 'Forbidden',
          message: 'Token has already been used',
        })
        return
      }

      try {
        console.log('💾 [Signature Verifier] Storing token as used', { jti: decoded.jti })

        await db.collection(USED_TOKENS_COLLECTION).insertOne({
          jti: decoded.jti,
          usedAt: new Date(),
          expiresAt: new Date(decoded.exp * 1000),
          path: fullPath,
          method: req.method,
        })

        console.log('✅ [Signature Verifier] Token stored successfully', { jti: decoded.jti })
      } catch (err: any) {
        if (err.code === 11000) {
          console.log('🔁 [Signature Verifier] Token replay detected (race condition)', {
            path: fullPath,
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
        path: fullPath,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    } else if (decoded.method) {
      console.log('✅ [Signature Verifier] Method matches', {
        method: decoded.method,
      })
    }

    if (decoded.path && decoded.path !== fullPath) {
      console.log('🚫 [Signature Verifier] Path mismatch', {
        expected: decoded.path,
        actual: fullPath,
        reqPath: req.path,
        originalUrl: req.originalUrl,
      })
      res.status(403).json({
        error: 'Forbidden',
        message: 'Invalid request signature',
      })
      return
    } else if (decoded.path) {
      console.log('✅ [Signature Verifier] Path matches', {
        path: decoded.path,
      })
    }

    if (decoded.bodyHash && req.body) {
      console.log('🔐 [Signature Verifier] Verifying body hash', {
        expectedHash: decoded.bodyHash,
      })

      const bodyStr = JSON.stringify(req.body)
      const actualHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
      
      console.log('🔐 [Signature Verifier] Body hash computed', {
        actualHash,
        bodyLength: bodyStr.length,
      })

      if (!secureCompare(actualHash, decoded.bodyHash)) {
        console.log('🚫 [Signature Verifier] Body hash mismatch', {
          path: fullPath,
          expected: decoded.bodyHash,
          actual: actualHash,
        })
        res.status(403).json({
          error: 'Forbidden',
          message: 'Request body has been tampered with',
        })
        return
      }

      console.log('✅ [Signature Verifier] Body hash matches')
    }

    console.log('✅ [Signature Verifier] All checks passed - Valid signature', {
      path: fullPath,
      method: req.method,
      jti: decoded.jti,
      issuedAt: new Date(decoded.iat * 1000).toISOString(),
      expiresAt: new Date(decoded.exp * 1000).toISOString(),
    })

    console.log('➡️ [Signature Verifier] Proceeding to next middleware')
    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      console.log('⏰ [Signature Verifier] Expired token', {
        path: fullPath,
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
        path: fullPath,
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

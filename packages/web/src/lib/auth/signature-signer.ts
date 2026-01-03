import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const KEY = process.env.API_KEY
const TOKEN_EXP = '5m'

interface SignRequestOptions {
  method?: string
  path?: string
  body?: any
}

export function signApiRequest(options: SignRequestOptions = {}): string {
  console.log('🔐 [Signature Signer] Starting signature generation', {
    method: options.method,
    path: options.path,
    hasBody: !!options.body,
  })

  if (!KEY) {
    console.error('❌ [Signature Signer] API_KEY is not configured')
    throw new Error('API_KEY is not configured')
  }

  const { method, path, body } = options
  const jti = crypto.randomBytes(16).toString('hex')

  console.log('🎲 [Signature Signer] Generated JTI', { jti })

  const tokenPayload: Record<string, any> = {
    iss: 'money-mapper-web',
    aud: 'money-mapper-backend',
    iat: Math.floor(Date.now() / 1000),
    jti,
  }

  if (method) {
    tokenPayload.method = method
    console.log('📋 [Signature Signer] Including method in token', { method })
  }

  if (path) {
    tokenPayload.path = path
    console.log('🛣️ [Signature Signer] Including path in token', { path })
  }

  if (body) {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    tokenPayload.bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
    console.log('🔐 [Signature Signer] Including body hash in token', {
      bodyHash: tokenPayload.bodyHash,
      bodyLength: bodyStr.length,
    })
  }

  console.log('📝 [Signature Signer] Token payload prepared', {
    iss: tokenPayload.iss,
    aud: tokenPayload.aud,
    iat: tokenPayload.iat,
    issuedAt: new Date(tokenPayload.iat * 1000).toISOString(),
    jti: tokenPayload.jti,
    hasMethod: !!tokenPayload.method,
    hasPath: !!tokenPayload.path,
    hasBodyHash: !!tokenPayload.bodyHash,
  })

  const token = jwt.sign(tokenPayload, KEY, {
    expiresIn: TOKEN_EXP,
    algorithm: 'HS256',
  })

  console.log('✅ [Signature Signer] Token signed successfully', {
    tokenLength: token.length,
    expiresIn: TOKEN_EXP,
    algorithm: 'HS256',
  })

  return token
}

export function addApiSignature(
  options: SignRequestOptions & { headers?: Record<string, string> } = {}
): Record<string, string> {
  try {
    console.log('🎯 [Signature Signer] addApiSignature called', {
      method: options.method,
      path: options.path,
      hasBody: !!options.body,
      hasHeaders: !!options.headers,
    })

    const { headers = {}, ...signOptions } = options
    const token = signApiRequest(signOptions)
    
    const finalHeaders = {
      ...headers,
      'x-internal-api-signature': token,
    }

    console.log('✅ [Signature Signer] Signature added to headers', {
      headerKeys: Object.keys(finalHeaders),
      signatureLength: token.length,
    })

    return finalHeaders
  } catch (error) {
    console.error('❌ [Signature Signer] Failed to generate internal signature:', error)
    throw error
  }
}

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
  if (!KEY) {
    throw new Error('API_KEY is not configured')
  }

  const { method, path, body } = options

  const jti = crypto.randomBytes(16).toString('hex')

  const tokenPayload: Record<string, any> = {
    iss: 'money-mapper-web',
    aud: 'money-mapper-backend',
    iat: Math.floor(Date.now() / 1000),
    jti,
  }

  if (method) {
    tokenPayload.method = method
  }

  if (path) {
    tokenPayload.path = path
  }

  if (body) {
    const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
    tokenPayload.bodyHash = crypto.createHash('sha256').update(bodyStr).digest('hex')
  }

  const token = jwt.sign(tokenPayload, KEY, {
    expiresIn: TOKEN_EXP,
    algorithm: 'HS256',
  })

  return token
}

export function addApiSignature(
  options: SignRequestOptions & { headers?: Record<string, string> } = {}
): Record<string, string> {
  try {
    const { headers = {}, ...signOptions } = options
    const token = signApiRequest(signOptions)
    
    return {
      ...headers,
      'x-internal-api-signature': token,
    }
  } catch (error) {
    console.error('❌ Failed to generate internal signature:', error)
    throw error
  }
}

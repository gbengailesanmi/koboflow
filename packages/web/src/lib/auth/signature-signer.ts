import jwt from 'jsonwebtoken'

const KEY = process.env.API_KEY
const TOKEN_EXP = '5m'

export function signApiRequest(payload: Record<string, any> = {}): string {
  if (!KEY) {
    throw new Error('INTERNAL_API_SECRET is not configured')
  }

  const tokenPayload = {
    ...payload,
    iss: 'money-mapper-web', // Issuer
    aud: 'money-mapper-backend', // audience
    iat: Math.floor(Date.now() / 1000),
  }

  const token = jwt.sign(tokenPayload, KEY, {
    expiresIn: TOKEN_EXP,
    algorithm: 'HS256',
  })

  return token
}

export function addApiSignature(headers: Record<string, string> = {}): Record<string, string> {
  try {
    const token = signApiRequest()
    
    return {
      ...headers,
      'x-internal-api-signature': token,
    }
  } catch (error) {
    console.error('❌ Failed to generate internal signature:', error)
    throw error
  }
}

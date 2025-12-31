import type { Request, Response, NextFunction } from 'express'

console.log('Middleware loaded', process.env.NEXTAUTH_SECRET)
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Dynamic import of jose
    const { jwtDecrypt } = await import('jose')
    
    const token =
      req.cookies['next-auth.session-token'] ||
      req.cookies['__Secure-next-auth.session-token']

    console.log('Auth token:', token)
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthenticated' })
    }

    // Decrypt the JWE token
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
    const { payload } = await jwtDecrypt(token, secret)

    if (!payload?.customerId || !payload?.email) {
      return res.status(401).json({ error: 'Invalid token payload' })
    }

    req.user = {
      userId: (payload.sub as string) ?? (payload.customerId as string),
      customerId: payload.customerId as string,
      email: payload.email as string,
      firstName: payload.firstName as string,
      lastName: payload.lastName as string,
    }

    next()
  } catch (err) {
    console.error('[Auth middleware]', err)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
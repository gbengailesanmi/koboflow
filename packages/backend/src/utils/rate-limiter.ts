import { rateLimit, ipKeyGenerator } from 'express-rate-limit'

export const loginRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req, res) => {
    const email = req.body?.email?.trim().toLowerCase() || 'unknown'
    const ip = ipKeyGenerator(req.ip || '127.0.0.1')
    return `${ip}:${email}`
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.log('🚨 [RATE LIMIT TRIGGERED] Login attempts exceeded', {
      email: req.body?.email,
      ip: req.ip,
      path: req.path,
      timestamp: new Date().toISOString(),
    })
    res.status(429).json({ message: 'Too many login attempts. Please try again later.' })
  },
})

export const oauthRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OAuth attempts. Please try again later.' },
  skipSuccessfulRequests: false,
})


export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please try again later.' },
  skipSuccessfulRequests: true,
})
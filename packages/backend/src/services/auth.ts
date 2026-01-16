import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { connectDB } from '../db/mongo'
import { sendVerificationEmail } from './email'
import { createUserSettings } from './settings'
import { initializeUserCategories } from '../db/helpers/spending-categories-helpers'
import { requireAuth } from '../middleware/middleware'
import { logger } from '@koboflow/shared/utils'
import { UpdateUserProfileSchema } from '@koboflow/shared/schemas'
import { loginRateLimiter, oauthRateLimiter, apiRateLimiter } from '../utils/rate-limiter'

export const authRoutes = Router()

// Used ONLY by credentials signup (NextAuth will handle login)
authRoutes.post('/signup', loginRateLimiter, async (req, res) => {
  try {
    const { firstName, lastName, email, password, passwordConfirm } = req.body

    if (!firstName || !lastName || !email || !password || !passwordConfirm) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ message: 'Passwords do not match.' })
    }

    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = await connectDB()

    logger.info({ 
      module: 'auth',
      dbName: db.databaseName,
      emailNormalized: normalizedEmail,
    }, 'User signup attempt')
    
    const existing = await db.collection('users').findOne({ email: normalizedEmail })
    if (existing) {
      return res.status(400).json({ message: 'Email already registered.' })
    }

    const customerId = randomUUID()
    const verificationToken = randomUUID()

    await db.collection('users').insertOne({
      customerId,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      authProvider: 'credentials',
      createdAt: new Date(),
    })

    await createUserSettings(customerId)
    await initializeUserCategories(customerId)

    await sendVerificationEmail(
      normalizedEmail,
      `${firstName} ${lastName}`,
      verificationToken
    )

    logger.info({ module: 'auth', customerId, email: normalizedEmail }, 'User signed up')

    return res.status(201).json({
      success: true,
      requiresVerification: true,
    })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Signup error')
    return res.status(500).json({ message: 'Signup failed' })
  }
})

authRoutes.post('/verify-email', apiRateLimiter, async (req, res) => {
  const { token } = req.body
  if (!token) {
    return res.status(400).json({ message: 'Token required' })
  }

  const db = await connectDB()
  const user = await db.collection('users').findOne({
    verificationToken: token,
    verificationTokenExpiry: { $gt: new Date() },
  })

  if (!user) {
    return res.status(400).json({ message: 'Invalid or expired token' })
  }

  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: { emailVerified: true, verifiedAt: new Date() },
      $unset: { verificationToken: '', verificationTokenExpiry: '' },
    }
  )

  return res.json({ success: true })
})

authRoutes.post('/resend-verification', loginRateLimiter, async (req, res) => {
  const { email } = req.body
  if (!email) {
    return res.status(400).json({ message: 'Email required' })
  }

  const db = await connectDB()
  const user = await db.collection('users').findOne({
    email: email.trim().toLowerCase(),
  })

  if (!user || user.emailVerified) {
    return res.json({ success: true })
  }

  const token = randomUUID()

  await db.collection('users').updateOne(
    { _id: user._id },
    {
      $set: {
        verificationToken: token,
        verificationTokenExpiry: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    }
  )

  await sendVerificationEmail(user.email, `${user.firstName} ${user.lastName}`, token)
  return res.json({ success: true })
})

authRoutes.get('/me', requireAuth, async (req, res) => {
  const db = await connectDB()
  const user = await db.collection('users').findOne({
    customerId: req.user!.customerId,
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({
    customerId: user.customerId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailVerified: user.emailVerified,
  })
})

authRoutes.patch('/me', requireAuth, async (req, res) => {
  try {
    // Validate input using Zod schema
    const validatedData = UpdateUserProfileSchema.parse(req.body)

    if (!validatedData.firstName || !validatedData.lastName) {
      return res.status(400).json({ message: 'First and last name required' })
    }

    const db = await connectDB()

    const updateFields: any = {
      updatedAt: new Date(),
    }

    if (validatedData.firstName) {
      updateFields.firstName = validatedData.firstName.trim()
    }
    if (validatedData.lastName) {
      updateFields.lastName = validatedData.lastName.trim()
    }
    if (validatedData.email) {
      updateFields.email = validatedData.email.trim().toLowerCase()
    }

    await db.collection('users').updateOne(
      { customerId: req.user!.customerId },
      { $set: updateFields }
    )

    logger.info({ module: 'auth', customerId: req.user!.customerId }, 'User profile updated')

    return res.json({ success: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      logger.error({ module: 'auth', err }, 'Validation error updating profile')
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: err.errors 
      })
    }
    
    logger.error({ module: 'auth', err }, 'Error updating profile')
    return res.status(500).json({ message: 'Failed to update profile' })
  }
})

authRoutes.patch('/user/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params

    // Ensure user can only update their own profile
    if (req.user!.customerId !== customerId) {
      return res.status(403).json({ message: 'Forbidden' })
    }

    // Validate input using Zod schema
    const validatedData = UpdateUserProfileSchema.parse(req.body)

    const db = await connectDB()

    const updateFields: any = {
      updatedAt: new Date(),
    }

    if (validatedData.firstName) {
      updateFields.firstName = validatedData.firstName.trim()
    }
    if (validatedData.lastName) {
      updateFields.lastName = validatedData.lastName.trim()
    }
    if (validatedData.email) {
      updateFields.email = validatedData.email.trim().toLowerCase()
    }

    const result = await db.collection('users').updateOne(
      { customerId },
      { $set: updateFields }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'User not found' })
    }

    logger.info({ module: 'auth', customerId }, 'User profile updated via customerId')

    return res.json({ success: true })
  } catch (err: any) {
    if (err.name === 'ZodError') {
      logger.error({ module: 'auth', err }, 'Validation error updating profile')
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: err.errors 
      })
    }
    
    logger.error({ module: 'auth', err }, 'Error updating profile')
    return res.status(500).json({ message: 'Failed to update profile' })
  }
})

// Public endpoint - no auth required (this IS the auth)
authRoutes.post('/validate-credentials', loginRateLimiter, async (req, res) => {
  console.log('🔐 [Backend] /validate-credentials - Request received')

  try {
    const { email, password } = req.body

    if (!email || !password) {
      console.log('❌ [Backend] /validate-credentials - Missing credentials')
      return res.status(400).json({ message: 'Email and password required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    console.log('🔍 [Backend] /validate-credentials - Looking up user', { email: normalizedEmail })

    const db = await connectDB()

    const user = await db.collection('users').findOne({ 
      email: normalizedEmail 
    })

    logger.info({ 
      module: 'auth',
      email: normalizedEmail,
      found: !!user,
      emailVerified: user?.emailVerified,
    }, 'Credentials validation attempt')

    if (!user || !user.password) {
      console.log('❌ [Backend] /validate-credentials - User not found or no password')
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    if (!user.emailVerified) {
      console.log('❌ [Backend] /validate-credentials - Email not verified')
      return res.status(401).json({ message: 'Email not verified' })
    }

    console.log('🔑 [Backend] /validate-credentials - Comparing password')
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) {
      console.log('❌ [Backend] /validate-credentials - Invalid password')
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    console.log('✅ [Backend] /validate-credentials - Authentication successful', {
      customerId: user.customerId,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    // Return only fields used in JWT token
    return res.json({
      customerId: user.customerId,
      firstName: user.firstName,
      lastName: user.lastName,
    })
  } catch (err) {
    console.error('💥 [Backend] /validate-credentials - Error:', err)
    logger.error({ module: 'auth', err }, 'Credentials validation error')
    return res.status(500).json({ message: 'Validation failed' })
  }
})

// Public endpoint - no auth required (this IS the auth)
authRoutes.post('/oauth/google', oauthRateLimiter, async (req, res) => {
  console.log('🔵 [Backend] /oauth/google - Request received')

  try {
    const { email, name } = req.body

    if (!email || !name) {
      console.log('❌ [Backend] /oauth/google - Missing email or name')
      return res.status(400).json({ message: 'Email and name required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    console.log('🔍 [Backend] /oauth/google - Looking up user', { email: normalizedEmail, name })

    const db = await connectDB()

    let user = await db.collection('users').findOne({ email: normalizedEmail })

    // Block provider mixing
    if (user && user.authProvider && user.authProvider !== 'google') {
      console.log('❌ [Backend] /oauth/google - Provider mixing blocked', {
        email: normalizedEmail,
        existingProvider: user.authProvider,
      })
      logger.warn({ module: 'auth', email: normalizedEmail }, 'Attempted Google sign-in with non-Google account')
      return res.status(400).json({ message: 'Email already registered with different provider' })
    }

    // Create new Google user if doesn't exist
    if (!user) {
      console.log('👤 [Backend] /oauth/google - Creating new Google user')

      const customerId = randomUUID()
      const nameParts = name.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      console.log('💾 [Backend] /oauth/google - Inserting user', {
        customerId,
        email: normalizedEmail,
        firstName,
        lastName,
      })

      await db.collection('users').insertOne({
        customerId,
        email: normalizedEmail,
        firstName,
        lastName,
        emailVerified: true,
        authProvider: 'google',
        createdAt: new Date(),
      })

      console.log('⚙️ [Backend] /oauth/google - Creating user settings and categories')
      await createUserSettings(customerId)
      await initializeUserCategories(customerId)

      logger.info({ module: 'auth', email: normalizedEmail, customerId }, 'Google user created')

      user = await db.collection('users').findOne({ customerId })
      console.log('✅ [Backend] /oauth/google - New user created', { customerId })
    } else {
      console.log('✅ [Backend] /oauth/google - Existing user found', {
        customerId: user.customerId,
      })
    }

    if (!user) {
      console.error('💥 [Backend] /oauth/google - Failed to retrieve user after creation')
      return res.status(500).json({ message: 'Failed to create/retrieve user' })
    }

    console.log('✅ [Backend] /oauth/google - Returning user data', {
      customerId: user.customerId,
      firstName: user.firstName,
      lastName: user.lastName,
    })

    return res.json({
      customerId: user.customerId,
      firstName: user.firstName,
      lastName: user.lastName,
    })
  } catch (err) {
    console.error('💥 [Backend] /oauth/google - Error:', err)
    logger.error({ module: 'auth', err }, 'Google sign-in error')
    return res.status(500).json({ message: 'Google sign-in failed' })
  }
})

// Protected endpoint - requires authentication
authRoutes.get('/customer-details/:customerId', requireAuth, async (req, res) => {
  try {
    const { customerId } = req.params

    // Ensure user can only access their own details
    if (req.user!.customerId !== customerId) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Mask BVN if present
    const maskBVN = (bvn?: string): string => {
      if (!bvn) return ''
      return `${bvn.slice(0, 3)}****${bvn.slice(-3)}`
    }

    const customerDetailsFromMono = user.customerDetailsFromMono
      ? {
          ...user.customerDetailsFromMono,
          bvn: maskBVN(user.customerDetailsFromMono.bvn),
        }
      : null

    return res.json({
      customerId: user.customerId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      emailVerified: user.emailVerified,
      customerDetailsFromMono,
      customerDetailsLastUpdated: user.customerDetailsLastUpdated || null,
    })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Get customer details error')
    return res.status(500).json({ error: 'Internal server error' })
  }
})

authRoutes.post('/session/create', apiRateLimiter, async (req, res) => {
  try {
    const { sessionId, customerId, expiresAt } = req.body

    if (!sessionId || !customerId) {
      return res.status(400).json({ message: 'SessionId and customerId required' })
    }

    const db = await connectDB()

    // Check if user exists
    const user = await db.collection('users').findOne({ customerId })
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Create session
    await db.collection('sessions').insertOne({
      sessionId,
      customerId,
      createdAt: new Date(),
      expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 60 * 60 * 1000),
      status: 'active',
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        lastActivity: new Date(),
      },
    })

    logger.info({ module: 'auth', customerId, sessionId }, 'Session created')

    return res.json({ success: true })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Session creation error')
    return res.status(500).json({ message: 'Failed to create session' })
  }
})

/**
 * Validate a session (called from backend middleware)
 * Public endpoint - used by middleware before setting requireAuth
 */
authRoutes.post('/session/validate', apiRateLimiter, async (req, res) => {
  try {
    const { sessionId, customerId } = req.body

    if (!sessionId || !customerId) {
      return res.status(400).json({ valid: false, message: 'SessionId and customerId required' })
    }

    const db = await connectDB()

    const session = await db.collection('sessions').findOne({
      sessionId,
      customerId,
    })

    if (!session) {
      return res.json({ valid: false, message: 'Session not found' })
    }

    if (session.status !== 'active') {
      return res.json({ valid: false, message: 'Session revoked' })
    }

    if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
      return res.json({ valid: false, message: 'Session expired' })
    }

    // Update last activity
    await db.collection('sessions').updateOne(
      { sessionId },
      { $set: { 'metadata.lastActivity': new Date() } }
    )

    return res.json({ valid: true })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Session validation error')
    return res.status(500).json({ valid: false, message: 'Validation failed' })
  }
})

authRoutes.post('/session/revoke', requireAuth, async (req, res) => {
  try {
    const { sessionId } = req.body
    const customerId = req.user!.customerId

    if (!sessionId) {
      return res.status(400).json({ message: 'SessionId required' })
    }

    const db = await connectDB()

    // Ensure session belongs to the authenticated user
    const result = await db.collection('sessions').updateOne(
      { sessionId, customerId },
      { 
        $set: { 
          status: 'revoked',
          revokedAt: new Date(),
        } 
      }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Session not found' })
    }

    logger.info({ module: 'auth', customerId, sessionId }, 'Session revoked')

    return res.json({ success: true })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Session revocation error')
    return res.status(500).json({ message: 'Failed to revoke session' })
  }
})

/**
 * Revoke all sessions for a user (logout all devices)
 */
authRoutes.post('/session/revoke-all', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const db = await connectDB()

    const result = await db.collection('sessions').updateMany(
      { customerId, status: 'active' },
      { 
        $set: { 
          status: 'revoked',
          revokedAt: new Date(),
        } 
      }
    )

    logger.info({ module: 'auth', customerId, count: result.modifiedCount }, 'All sessions revoked')

    return res.json({ success: true, count: result.modifiedCount })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Session revocation error')
    return res.status(500).json({ message: 'Failed to revoke sessions' })
  }
})

/**
 * Get all active sessions for current user
 */
authRoutes.get('/sessions', requireAuth, async (req, res) => {
  try {
    const customerId = req.user!.customerId
    const db = await connectDB()

    const sessions = await db.collection('sessions')
      .find({ customerId, status: 'active' })
      .sort({ createdAt: -1 })
      .toArray()

    return res.json({ 
      success: true, 
      sessions: sessions.map(s => ({
        sessionId: s.sessionId,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        lastActivity: s.metadata?.lastActivity,
        userAgent: s.metadata?.userAgent,
      }))
    })
  } catch (err) {
    logger.error({ module: 'auth', err }, 'Error fetching sessions')
    return res.status(500).json({ message: 'Failed to fetch sessions' })
  }
})

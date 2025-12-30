// /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/backend/src/routes/auth.ts
import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import config from '../config'
import { connectDB } from '../db/mongo'
import { sendVerificationEmail } from '../services/email'
import { createUserSettings } from '../services/settings'
import { createSession, deleteSession, deleteAllUserSessions, getUserSessions } from '../services/session'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import { initializeUserCategories } from '../db/helpers/spending-categories-helpers'
import { logger } from '@money-mapper/shared/utils'

export const authRoutes = Router()
const isProd = config.IS_PRODUCTION

// ------------------------------------- SIGN UP ------------------------------------- //
authRoutes.post('/signup', async (req, res) => {
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
    const existing = await db.collection('users').findOne({ email: normalizedEmail })
    
    if (existing) {
      return res.status(400).json({ message: 'Email is already registered.' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const customerId = randomUUID()
    const verificationToken = randomUUID()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const insertResult = await db.collection('users').insertOne({
      email: normalizedEmail,
      password: hashedPassword,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      customerId,
      emailVerified: false,
      verificationToken,
      verificationTokenExpiry,
      createdAt: new Date(),
      authProvider: 'credentials'
    })

    if (!insertResult.insertedId) {
      return res.status(500).json({ message: 'Failed to create user.' })
    }

    logger.info({ module: 'auth', customerId, name: `${firstName} ${lastName}`, email: normalizedEmail }, 'User created')

    await createUserSettings(customerId)
    logger.info({ module: 'auth', customerId }, 'User settings created')
    
    const userCategories = await initializeUserCategories(customerId)

    const emailResult = await sendVerificationEmail(
      normalizedEmail,
      `${firstName} ${lastName}`,
      verificationToken
    )

    if (!emailResult.success) {
      await db.collection('users').deleteOne({ _id: insertResult.insertedId })
      return res.status(500).json({ message: 'Failed to send verification email. Please try again.' })
    }

    res.status(201).json({
      success: true,
      requiresVerification: true,
      message: 'Account created! Please check your email to verify your account.'
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Signup error')
    res.status(500).json({ message: 'An unexpected error occurred. Please try again.' })
  }
})

// ------------------------------------- LOGIN ------------------------------------- //
authRoutes.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'All fields are required.' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = await connectDB()
    const user = await db.collection('users').findOne({ email: normalizedEmail })

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in.',
        requiresVerification: true 
      })
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const sessionId = await createSession(
      user.customerId,
      user.email,
      user.firstName,
      user.lastName,
      req.headers['user-agent'],
      req.ip
    )

    res.cookie('session-id', sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    res.json({
      success: true,
      user: {
        customerId: user.customerId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Login error')
    res.status(500).json({ message: 'An error occurred during login.' })
  }
})

// ------------------------------------- LOGOUT ------------------------------------- //
authRoutes.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const sessionId = req.sessionId

    if (sessionId) {
      await deleteSession(sessionId)
    }

    res.clearCookie('session-id', {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',       // cross-site only in prod
      path: '/'
    })
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Logout error')
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    })
  }
})

// ------------------------------ LOG OUT ALL DEVICES ------------------------------ //
authRoutes.post('/logout-all', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const deletedCount = await deleteAllUserSessions(customerId)

    res.clearCookie('session-id', {
      httpOnly: true,
      secure: config.IS_PRODUCTION,
      sameSite: isProd ? 'none' : 'lax',
      path: '/'
    })
    
    res.json({
      success: true,
      message: `Logged out from ${deletedCount} device(s)`
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Logout all error')
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    })
  }
})

// ----------------------------------- SESSIONS ----------------------------------- //
authRoutes.get('/sessions', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId

    if (!customerId) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const sessions = await getUserSessions(customerId)
    
    res.json({
      success: true,
      sessions: sessions.map(session => ({
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastAccessedAt: session.lastAccessedAt,
        expiresAt: session.expiresAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress,
        isCurrent: session.sessionId === req.sessionId
      }))
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Get sessions error')
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    })
  }
})

// ----------------------------- GET VERIFY EMAIL ----------------------------- //
authRoutes.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      })
    }

    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          verifiedAt: new Date(),
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpiry: '',
        },
      }
    )

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update verification status'
      })
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      customerId: user.customerId,
    })
  } catch (error) {
    logger.error({ module: 'auth', error }, 'Error verifying email')
    res.status(500).json({
      success: false,
      message: 'An error occurred during verification'
    })
  }
})

// ----------------------------- POST VERIFY EMAIL ----------------------------- //
authRoutes.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Verification token is required'
      })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      })
    }

    const updateResult = await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          verifiedAt: new Date(),
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpiry: '',
        },
      }
    )

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update verification status'
      })
    }

    res.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
      customerId: user.customerId,
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to verify email'
    })
  }
})

// ------------------------ RESEND VERIFICATION EMAIL ------------------------ //
authRoutes.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = await connectDB()
    const user = await db.collection('users').findOne({ email: normalizedEmail })

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      })
    }

    const verificationToken = randomUUID()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          verificationToken,
          verificationTokenExpiry,
        },
      }
    )

    const emailResult = await sendVerificationEmail(
      user.email,
      `${user.firstName} ${user.lastName}`,
      verificationToken
    )

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      })
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully',
    })
  } catch (error) {
    console.error('Error resending verification email:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    })
  }
})

// ------------------------------- NORMAL USER OAUTH ------------------------------- //
authRoutes.post('/oauth-user', async (req, res) => {
  try {
    const { email, name, provider } = req.body

    if (!email || !name || !provider) {
      return res.status(400).json({ 
        success: false,
        message: 'Email, name, and provider are required' 
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = await connectDB()
    const existingUser = await db.collection('users').findOne({ email: normalizedEmail })

    if (existingUser) {
      if (!existingUser.customerId) {
        const customerId = randomUUID()
        await db.collection('users').updateOne(
          { email: normalizedEmail },
          {
            $set: {
              customerId,
              authProvider: provider,
              emailVerified: true,
            }
          }
        )
        
        await createUserSettings(customerId)

        return res.json({
          success: true,
          customerId,
          user: {
            customerId,
            email: existingUser.email,
            firstName: existingUser.firstName,
            lastName: existingUser.lastName
          }
        })
      }

      return res.json({
        success: true,
        customerId: existingUser.customerId,
        user: {
          customerId: existingUser.customerId,
          email: existingUser.email,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName
        }
      })
    }

    const customerId = randomUUID()
    const nameParts = name.split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    await db.collection('users').insertOne({
      email: normalizedEmail,
      customerId,
      firstName,
      lastName,
      emailVerified: true,
      createdAt: new Date(),
      authProvider: provider
    })

    await createUserSettings(customerId)

    res.json({
      success: true,
      customerId,
      user: {
        customerId,
        email: normalizedEmail,
        firstName,
        lastName
      }
    })
  } catch (error) {
    console.error('OAuth user error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    })
  }
})

// ------------------------------- GET USER ------------------------------- //
authRoutes.get('/user/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      })
    }

    const db = await connectDB()
    const user = await db.collection('users').findOne({ customerId })

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user: {
        customerId: user.customerId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    })
  }
})

// ------------------------------- UPDATE USER ------------------------------- //
authRoutes.patch('/user/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    const { firstName, lastName, email, totalBudgetLimit } = req.body

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      })
    }

    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, and email are required'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const db = await connectDB()

    const existingUser = await db.collection('users').findOne({
      email: normalizedEmail,
      customerId: { $ne: customerId }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already taken'
      })
    }

    const updateData: any = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      updatedAt: new Date()
    }

    if (totalBudgetLimit !== undefined && totalBudgetLimit >= 0) {
      updateData.totalBudgetLimit = totalBudgetLimit
    }

    const result = await db.collection('users').updateOne(
      { customerId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    if (totalBudgetLimit !== undefined && totalBudgetLimit >= 0) {
      const existingBudget = await db.collection('budgets').findOne({ customerId })
      
      if (!existingBudget) {
        await db.collection('budgets').updateOne(
          { customerId },
          {
            $set: {
              totalBudgetLimit,
              updatedAt: new Date()
            },
            $setOnInsert: {
              categories: [],
              createdAt: new Date()
            }
          },
          { upsert: true }
        )
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Update user profile error:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred'
    })
  }
})

// ------------------------------- GOOGLE OAUTH ------------------------------- //
authRoutes.get('/google', (req, res) => {
  const clientId = config.GOOGLE_CLIENT_ID
  const redirectUri = config.GOOGLE_REDIRECT_URI
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ 
      success: false, 
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI in env config.' 
    })
  }

  const scope = 'openid email profile'
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`

  res.redirect(authUrl)
})

// ------------------------- GOOGLE OAUTH CALLBACK ------------------------- //
authRoutes.post('/google/callback', async (req, res) => {
  try {
    const { code } = req.body

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ message: 'Missing OAuth code' })
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.GOOGLE_CLIENT_ID!,
        client_secret: config.GOOGLE_CLIENT_SECRET!,
        redirect_uri: config.GOOGLE_REDIRECT_URI!,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      return res.status(401).json({ message: 'Google token exchange failed' })
    }

    const tokens = await tokenResponse.json()

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoRes.ok) {
      return res.status(401).json({ message: 'Google user fetch failed' })
    }

    const googleUser = await userInfoRes.json()
    const email = googleUser.email.toLowerCase()

    const db = await connectDB()
    let user = await db.collection('users').findOne({ email })

    if (!user) {
      const customerId = randomUUID()

      await db.collection('users').insertOne({
        email,
        firstName: googleUser.given_name || 'User',
        lastName: googleUser.family_name || '',
        customerId,
        emailVerified: true,
        authProvider: 'google',
        createdAt: new Date(),
      })

      await createUserSettings(customerId)

      user = await db.collection('users').findOne({ email })
    }

    const sessionId = await createSession(
      user.customerId,
      user.email,
      user.firstName,
      user.lastName,
      req.headers['user-agent'],
      req.ip
    )

    res.cookie('session-id', sessionId, {
      httpOnly: true,
      secure: config.IS_PRODUCTION,
      sameSite: config.IS_PRODUCTION ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    })

    return res.status(200).json({
      success: true,
      customerId: user.customerId,
    })
  } catch (err) {
    console.error('Google OAuth error:', err)
    return res.status(500).json({ message: 'OAuth failed' })
  }
})

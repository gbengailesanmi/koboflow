import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { connectDB } from '../db/mongo'
import { sendVerificationEmail } from '../services/email'
import { createUserSettings } from '../services/settings'
import { initializeUserCategories } from '../db/helpers/spending-categories-helpers'
import { requireAuth } from '../middleware/middleware'
import { logger } from '@money-mapper/shared/utils'

export const authRoutes = Router()

// ------------------------------------- SIGN UP ------------------------------------- //
// Used ONLY by credentials signup (NextAuth will handle login)
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

        console.log('[SIGNUPcedce][DEBUG]', {
      dbName: db.databaseName,
      mongoUri: process.env.MONGODB_URI,
      emailRaw: email,
      emailNormalized: normalizedEmail,
    })
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

// ----------------------------------- VERIFY EMAIL ----------------------------------- //
authRoutes.post('/verify-email', async (req, res) => {
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

// ----------------------------- RESEND VERIFICATION EMAIL ----------------------------- //
authRoutes.post('/resend-verification', async (req, res) => {
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

// ----------------------------------- GET USER ----------------------------------- //
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

// ----------------------------------- UPDATE USER ----------------------------------- //
authRoutes.patch('/me', requireAuth, async (req, res) => {
  const { firstName, lastName } = req.body

  if (!firstName || !lastName) {
    return res.status(400).json({ message: 'First and last name required' })
  }

  const db = await connectDB()

  await db.collection('users').updateOne(
    { customerId: req.user!.customerId },
    {
      $set: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        updatedAt: new Date(),
      },
    }
  )

  return res.json({ success: true })
})

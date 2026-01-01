import { Router } from 'express'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { connectDB } from '../db/mongo'
import { sendVerificationEmail } from '../services/email'
import { createUserSettings } from '../services/settings'
import { initializeUserCategories } from '../db/helpers/spending-categories-helpers'
import { requireAuth } from '../middleware/middleware'
import { logger } from '@money-mapper/shared/utils'
import { UpdateUserProfileSchema } from '@money-mapper/shared/schemas'

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

// ----------------------------------- UPDATE USER BY CUSTOMER ID ----------------------------------- //
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

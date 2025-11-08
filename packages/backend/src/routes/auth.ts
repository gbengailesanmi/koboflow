import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { connectDB } from '../db/mongo'
import { sendVerificationEmail } from '../services/email'
import { createUserSettings } from '../services/settings'

export const authRoutes = Router()

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

    await createUserSettings(customerId)

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
    console.error('Signup error:', error)
    res.status(500).json({ message: 'An unexpected error occurred. Please try again.' })
  }
})

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

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        customerId: user.customerId,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    }
    
    if (!isProduction) {
      const cookieValue = `auth-token=${token}; Max-Age=604800; Path=/; Domain=localhost; HttpOnly; SameSite=Lax`
      res.setHeader('Set-Cookie', cookieValue)
    } else {
      res.cookie('auth-token', token, cookieOptions)
    }

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
    console.error('Login error:', error)
    res.status(500).json({ message: 'An error occurred during login.' })
  }
})

authRoutes.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'
  res.clearCookie('auth-token', {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/'
  })
  
  res.json({
    success: true,
    message: 'Logged out successfully'
  })
})

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
    console.error('Error verifying email:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred during verification'
    })
  }
})

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

authRoutes.patch('/user/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    const { firstName, lastName, email, currency, totalBudgetLimit } = req.body

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

    if (currency) {
      updateData.currency = currency
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

authRoutes.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  
  if (!clientId) {
    return res.status(500).json({ 
      success: false, 
      message: 'Google OAuth not configured. Please set GOOGLE_CLIENT_ID in environment variables.' 
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

authRoutes.get('/debug-oauth-config', (req, res) => {
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'
  res.json({
    configured: !!process.env.GOOGLE_CLIENT_ID,
    clientIdPrefix: process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: redirectUri,
    frontendUrl: process.env.FRONTEND_URL || 'NOT SET',
    port: process.env.PORT || 3001
  })
})

authRoutes.get('/google/callback', async (req, res) => {
  try {
    const { code } = req.query

    if (!code || typeof code !== 'string') {
      return res.redirect('/login?error=oauth_failed')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/api/auth/google/callback'

    if (!clientId || !clientSecret) {
      return res.redirect('/login?error=oauth_not_configured')
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      console.error('Google token exchange failed:', await tokenResponse.text())
      return res.redirect('/login?error=oauth_token_failed')
    }

    const tokens = await tokenResponse.json()

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    if (!userInfoResponse.ok) {
      console.error('Google userinfo failed:', await userInfoResponse.text())
      return res.redirect('/login?error=oauth_userinfo_failed')
    }

    const googleUser = await userInfoResponse.json()
    const email = googleUser.email.toLowerCase()

    const db = await connectDB()
    let user = await db.collection('users').findOne({ email })

    if (!user) {
      const customerId = randomUUID()
      
      await db.collection('users').insertOne({
        email,
        firstName: googleUser.given_name || googleUser.name?.split(' ')[0] || 'User',
        lastName: googleUser.family_name || googleUser.name?.split(' ').slice(1).join(' ') || '',
        customerId,
        emailVerified: true, // Google emails are pre-verified
        createdAt: new Date(),
        authProvider: 'google',
        googleId: googleUser.id,
      })

      await createUserSettings(customerId)
      
      user = await db.collection('users').findOne({ email })
    } else if (!user.emailVerified) {
      await db.collection('users').updateOne(
        { _id: user._id },
        { $set: { emailVerified: true } }
      )
      user.emailVerified = true
    }

    const token = jwt.sign(
      { 
        userId: user._id.toString(),
        customerId: user.customerId,
        email: user.email 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    }

    if (!isProduction) {
      const cookieValue = `auth-token=${token}; Max-Age=604800; Path=/; Domain=localhost; HttpOnly; SameSite=Lax`
      res.setHeader('Set-Cookie', cookieValue)
    } else {
      res.cookie('auth-token', token, cookieOptions)
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Login successful! Redirecting...</p>
          <script>
            // Delay to ensure cookie is set
            setTimeout(() => {
              window.location.href = '${frontendUrl}/${user.customerId}/dashboard';
            }, 100);
          </script>
        </body>
      </html>
    `)
  } catch (error) {
    console.error('Google OAuth callback error:', error)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    res.redirect(`${frontendUrl}/login?error=oauth_error`)
  }
})

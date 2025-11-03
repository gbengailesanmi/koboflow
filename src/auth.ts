import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { v4 as uuidv4 } from 'uuid'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const { connectDB } = await import('@/db/mongo')
        const bcrypt = await import('bcrypt')
        const db = await connectDB()
        
        const user = await db.collection('users').findOne({ 
          email: (credentials.email as string).toLowerCase() 
        })
        
        if (!user || !user.password) {
          return null
        }
        
        const isValid = await bcrypt.compare(credentials.password as string, user.password)
        
        if (!isValid) {
          return null
        }
        
        // Check if email is verified
        if (!user.emailVerified) {
          throw new Error('Please verify your email before logging in.')
        }
        
        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          customerId: user.customerId
        }
      }
    })
  ],
  callbacks: {
    async authorized({ auth, request }) {
      const { pathname } = request.nextUrl
      const isAuthenticated = !!auth?.user?.customerId
      
      // Public routes that don't require authentication
      const publicRoutes = ['/', '/login', '/signup', '/verify-email', '/auth-redirect']
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
      
      // API routes and auth callbacks should always be allowed
      if (pathname.startsWith('/api')) {
        return true
      }
      
      // If user is authenticated and trying to access login or signup, redirect to dashboard
      if (isAuthenticated && (pathname === '/login' || pathname === '/signup')) {
        const dashboardUrl = new URL(`/${auth.user.customerId}/dashboard`, request.nextUrl.origin)
        return Response.redirect(dashboardUrl)
      }
      
      // If user is not authenticated and trying to access protected routes, redirect to login
      if (!isAuthenticated && !isPublicRoute) {
        const loginUrl = new URL('/login', request.nextUrl.origin)
        loginUrl.searchParams.set('redirectTo', pathname)
        return Response.redirect(loginUrl)
      }
      
      return true
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const { connectDB } = await import('@/db/mongo')
        const { createUserSettings } = await import('@/lib/settings-helpers')
        const db = await connectDB()
        
        const existingUser = await db.collection('users').findOne({ email: user.email })
        
        if (!existingUser) {
          const customerId = uuidv4()
          const nameParts = user.name?.split(' ') || ['', '']
          const firstName = nameParts[0] || ''
          const lastName = nameParts.slice(1).join(' ') || ''
          
          await db.collection('users').updateOne(
            { email: user.email },
            {
              $set: {
                customerId,
                firstName,
                lastName,
                emailVerified: true,
                createdAt: new Date(),
                authProvider: 'google'
              }
            },
            { upsert: true }
          )
          
          await createUserSettings(customerId)
          
          // Update user object with customerId
          user.customerId = customerId
        } else if (!existingUser.customerId) {
          const customerId = uuidv4()
          await db.collection('users').updateOne(
            { email: user.email },
            {
              $set: {
                customerId,
                authProvider: 'google'
              }
            }
          )
          
          await createUserSettings(customerId)
          
          // Update user object with customerId
          user.customerId = customerId
        } else {
          // User exists with customerId
          user.customerId = existingUser.customerId
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      // Add customerId to token on sign in
      if (user?.customerId) {
        token.customerId = user.customerId
      }
      return token
    },
    async session({ session, token }) {
      // Add customerId to session from token
      if (token?.customerId) {
        session.user.customerId = token.customerId as string
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // If redirecting to callback or auth-redirect, continue
      if (url.startsWith(baseUrl)) {
        return url
      }
      // Default redirect to dashboard via auth-redirect
      return `${baseUrl}/auth-redirect`
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
})

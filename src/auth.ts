import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import clientPromise from "@/lib/mongodb-client"
import { v4 as uuidv4 } from 'uuid'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(clientPromise),
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
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // Check if user already exists using your existing mongo.js connection
        const { connectDB } = await import('@/db/mongo')
        const { createUserSettings } = await import('@/lib/settings-helpers')
        const db = await connectDB()
        
        const existingUser = await db.collection('users').findOne({ email: user.email })
        
        if (!existingUser) {
          // Create new user with customerId
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
                emailVerified: true, // Google accounts are pre-verified
                createdAt: new Date(),
                authProvider: 'google'
              }
            },
            { upsert: true }
          )
          
          // Create default settings for new Google user
          await createUserSettings(customerId)
        } else if (!existingUser.customerId) {
          // Add customerId to existing user if missing
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
          
          // Create settings if they don't exist
          await createUserSettings(customerId)
        }
      }
      return true
    },
    async session({ session, user }) {
      // Add customerId to session using your existing mongo.js connection
      if (session.user) {
        const { connectDB } = await import('@/db/mongo')
        const db = await connectDB()
        const userData = await db.collection('users').findOne({ email: session.user.email })
        
        if (userData?.customerId) {
          session.user.customerId = userData.customerId
        }
      }
      return session
    },
    async redirect({ url, baseUrl }) {
      // Allow the auth-redirect endpoint to handle dashboard redirects
      if (url.startsWith(baseUrl)) return url
      return `${baseUrl}/auth-redirect`
    }
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
})

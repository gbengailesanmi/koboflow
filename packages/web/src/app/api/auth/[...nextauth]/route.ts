import NextAuth, { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/mongo/mongo'
import config from '@/config'
import { logger } from '@money-mapper/shared'

export const authOptions: AuthOptions = {
  secret: config.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },

  cookies: {
    sessionToken: {
      name:
        config.IS_PRODUCTION
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: true,
      },
    },
  },

  providers: [
    // ---------------- GOOGLE ----------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
        },
      },
    }),

    // -------------- CREDENTIALS --------------
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { type: 'text' },
        password: { type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const db = await getDb()
        const email = credentials.email.toLowerCase().trim()

        const user = await db.collection('users').findOne({ email })

        // logger.info({ 
        //   module: 'auth-nextauth',
        //   email,
        //   found: !!user,
        //   emailVerified: user?.emailVerified,
        // }, 'Credentials login attempt')

        if (!user || !user.password) return null
        if (!user.emailVerified) return null

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          customerId: user.customerId,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const db = await getDb()
        const email = user.email!.toLowerCase()

        const existing = await db.collection('users').findOne({ email })

        if (existing && existing.authProvider !== account.provider) { //block provider mixing
          return false
        }

        if (account.provider === 'google' && !existing) {
          const customerId = randomUUID()

          await db.collection('users').insertOne({
            customerId,
            email,
            firstName: user.name?.split(' ')[0] ?? '',
            lastName: user.name?.split(' ').slice(1).join(' ') ?? '',
            emailVerified: true,
            authProvider: 'google',
            createdAt: new Date(),
          })

          logger.info({ module: 'auth-nextauth', email, customerId }, 'Google user created')
        }
      }

      return true
    },

    async jwt({ token, user }) {
      const db = await getDb()
      if (user) {
        const dbUser = await db.collection('users').findOne({
          email: user.email!.toLowerCase(),
        })

        if (!dbUser) {
          token.invalid = true
          return token
        }

        token.customerId = dbUser.customerId
        token.firstName = dbUser.firstName
        token.lastName = dbUser.lastName
        
        if (!token.sessionId) {
          token.sessionId = randomUUID()
        }

        return token
      }

      if (!token.customerId) {
        token.invalid = true
        return token
      }

      const dbUser = await db.collection('users').findOne({
        customerId: token.customerId,
      })

      if (!dbUser) {
        token.invalid = true
      }

      return token
    },

    async session({ session, token }) {
      if (token.invalid) {
        return {
          ...session,
          user: undefined,
        }
      }
      
      if (session.user) {
        session.user.customerId = token.customerId as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }

      // logger.info({ module: 'auth-nextauth', user: session.user }, 'Session created')
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
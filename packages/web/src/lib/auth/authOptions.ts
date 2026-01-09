import { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { randomUUID } from 'crypto'
import config from '@/config'
import { logger } from '@koboflow/shared'
import { validateCredentials, googleSignIn, createSession } from '@/lib/api/api-service'


export const authOptions: AuthOptions = {
  secret: config.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 1 * 60 * 60
  },

  cookies: {
    sessionToken: {
      name:
        config.IS_PRODUCTION
          ? '__Secure-next-auth.session-token'
          : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: config.IS_PRODUCTION,
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
          // prompt: 'consent',
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
        if (!credentials?.email || !credentials.password) {
          return null
        }

        const user = await validateCredentials(
          credentials.email,
          credentials.password
        )

        return user
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const userData = await googleSignIn(user.email!, user.name!)
        
        if (!userData) {
          logger.error({ module: 'auth-nextauth' }, 'Google sign-in failed')
          return false
        }

        user.customerId = userData.customerId
        user.firstName = userData.firstName
        user.lastName = userData.lastName
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.customerId = user.customerId
        token.firstName = user.firstName
        token.lastName = user.lastName
        
        if (!token.sessionId) {
          token.sessionId = randomUUID()

          const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
          
          try {
            const result = await createSession(
              token.sessionId as string,
              user.customerId as string,
              expiresAt
            )

            if (!result.success) {
              logger.error(
                { module: 'auth-nextauth', error: result.message },
                'Failed to create session'
              )
            }
          } catch (error) {
            logger.error({ module: 'auth-nextauth', error }, 'Error creating session')
          }
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.customerId = token.customerId as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.sessionId = token.sessionId as string
      }

      return session
    },
  },
}
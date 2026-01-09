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
        console.log('🔐 [NextAuth] CredentialsProvider.authorize - START', {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
        })

        if (!credentials?.email || !credentials.password) {
          console.log('❌ [NextAuth] CredentialsProvider.authorize - Missing credentials')
          return null
        }

        const user = await validateCredentials(
          credentials.email,
          credentials.password
        )

        if (user) {
          console.log('✅ [NextAuth] CredentialsProvider.authorize - User validated', {
            customerId: user.customerId,
            firstName: user.firstName,
            lastName: user.lastName,
          })
        } else {
          console.log('❌ [NextAuth] CredentialsProvider.authorize - Validation failed')
        }

        return user
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      console.log('🚪 [NextAuth] signIn callback - START', {
        provider: account?.provider,
        email: user.email,
        hasCustomerId: !!user.customerId,
      })

      if (account?.provider === 'google') {
        console.log('🔵 [NextAuth] signIn - Google OAuth flow')

        const userData = await googleSignIn(user.email!, user.name!)
        
        if (!userData) {
          console.log('❌ [NextAuth] signIn - Google sign-in failed')
          logger.error({ module: 'auth-nextauth' }, 'Google sign-in failed')
          return false
        }

        console.log('✅ [NextAuth] signIn - Google user data received', {
          customerId: userData.customerId,
          firstName: userData.firstName,
          lastName: userData.lastName,
        })

        // Update user object with data from backend
        user.customerId = userData.customerId
        user.firstName = userData.firstName
        user.lastName = userData.lastName
      }

      console.log('✅ [NextAuth] signIn callback - SUCCESS', {
        customerId: user.customerId,
        firstName: user.firstName,
        lastName: user.lastName,
      })

      return true
    },

    async jwt({ token, user }) {
      console.log('🎫 [NextAuth] jwt callback - START', {
        hasUser: !!user,
        existingToken: {
          customerId: token.customerId,
          firstName: token.firstName,
          lastName: token.lastName,
          sessionId: token.sessionId,
        },
      })

      // On initial sign-in, store user data in token
      if (user) {
        console.log('👤 [NextAuth] jwt - Initial sign-in, storing user data in token', {
          customerId: user.customerId,
          firstName: user.firstName,
          lastName: user.lastName,
        })

        token.customerId = user.customerId
        token.firstName = user.firstName
        token.lastName = user.lastName
        
        if (!token.sessionId) {
          token.sessionId = randomUUID()
          console.log('🆔 [NextAuth] jwt - Generated new sessionId', {
            sessionId: token.sessionId,
          })

          // ✅ CREATE SESSION IN BACKEND (via API call)
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
          
          try {
            const result = await createSession(
              token.sessionId as string,
              user.customerId as string,
              expiresAt
            )

            if (result.success) {
              console.log('✅ [NextAuth] jwt - Session created in backend', {
                sessionId: token.sessionId,
              })
            } else {
              console.error('❌ [NextAuth] jwt - Failed to create session in backend', {
                message: result.message,
              })
              logger.error(
                { module: 'auth-nextauth', error: result.message },
                'Failed to create session'
              )
            }
          } catch (error) {
            console.error('💥 [NextAuth] jwt - Error creating session', error)
            logger.error({ module: 'auth-nextauth', error }, 'Error creating session')
          }
        }
      } else {
        console.log('🔄 [NextAuth] jwt - Subsequent request, using existing token')
      }

      console.log('✅ [NextAuth] jwt callback - Token ready', {
        customerId: token.customerId,
        firstName: token.firstName,
        lastName: token.lastName,
        sessionId: token.sessionId,
      })

      return token
    },

    async session({ session, token }) {
      console.log('📋 [NextAuth] session callback - START', {
        tokenData: {
          customerId: token.customerId,
          firstName: token.firstName,
          lastName: token.lastName,
          sessionId: token.sessionId,
        },
      })

      if (session.user) {
        session.user.customerId = token.customerId as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
        session.user.sessionId = token.sessionId as string  // ✅ Add sessionId to session

        console.log('✅ [NextAuth] session callback - Session created', {
          customerId: session.user.customerId,
          firstName: session.user.firstName,
          lastName: session.user.lastName,
          sessionId: session.user.sessionId,
          email: session.user.email,
        })
      } else {
        console.log('⚠️ [NextAuth] session callback - No user in session')
      }

      return session
    },
  },
}
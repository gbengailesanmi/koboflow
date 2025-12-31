import NextAuth, { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'
import { getDb } from '@/lib/mongo/mongo'

console.log('[AUTH] NextAuth route loaded', process.env.NEXTAUTH_SECRET)

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },

  providers: [
    // ---------------- GOOGLE ----------------
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

        console.log('[AUTH][CREDENTIALS] lookup', {
          email,
          found: !!user,
          emailVerified: user?.emailVerified,
        })

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
    /**
     * 🔐 Runs for BOTH Google + Credentials
     * This is where Google users MUST be created
     */
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const db = await getDb()
        const email = user.email!.toLowerCase()

        const existing = await db.collection('users').findOne({ email })

        if (!existing) {
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

          console.log('[AUTH][GOOGLE] user created', { email, customerId })
        }
      }

      return true
    },

    /**
     * 🔑 Persist DB identity into JWT
     */
    async jwt({ token, user }) {
      if (user) {
        token.customerId = (user as any).customerId
        token.firstName = (user as any).firstName
        token.lastName = (user as any).lastName
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.customerId = token.customerId as string
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }

      console.log('[AUTH][SESSION]', session.user)
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

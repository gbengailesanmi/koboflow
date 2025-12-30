// packages/web/src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type AuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@auth/mongodb-adapter'
import clientPromise from '@/lib/mongo/mongo'
import bcrypt from 'bcrypt'

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),

  session: {
    strategy: 'database', // ✅ now typed correctly
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { type: 'text' },
        password: { type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null

        const db = (await clientPromise).db()
        const user = await db.collection('users').findOne({
          email: credentials.email,
        })

        if (!user || !user.password) return null

        const ok = await bcrypt.compare(credentials.password, user.password)
        if (!ok) return null

        return {
          id: user._id.toString(),
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          customerId: user.customerId,
        }
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (session.user && user?.customerId) {
        session.user.customerId = user.customerId
      }
      return session
    },
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

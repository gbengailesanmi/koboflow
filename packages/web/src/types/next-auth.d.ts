// /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/web/src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      customerId: string
      firstName?: string
      lastName?: string
      sessionId?: string  // ✅ Add sessionId to session
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    customerId: string
    firstName?: string
    lastName?: string
  }
}

// ✅ Add sessionId to JWT token type
declare module 'next-auth/jwt' {
  interface JWT {
    customerId?: string
    firstName?: string
    lastName?: string
    sessionId?: string
  }
}

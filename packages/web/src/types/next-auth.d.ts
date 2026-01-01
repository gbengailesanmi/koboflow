// /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/web/src/types/next-auth.d.ts
import { DefaultSession, DefaultUser } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      customerId: string
      firstName?: string
      lastName?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    customerId: string
    firstName?: string
    lastName?: string
  }
}

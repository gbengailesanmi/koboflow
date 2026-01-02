// /Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/web/src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      customerId: string
      firstName?: string
      lastName?: string
    } & DefaultSession['user']
  }

  interface User {
    id?: string
    customerId: string
    firstName?: string
    lastName?: string
  }
}

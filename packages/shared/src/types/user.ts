///Users/gbenga.ilesanmi/Github/PD/money-mapper/packages/shared/src/types/user.ts
export type AuthProvider = 'google' | 'credentials'

export interface User {
  _id?: unknown
  customerId: string
  email: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  authProvider: AuthProvider
  createdAt: Date
}
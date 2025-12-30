export type User = {
  customerId: string
  email: string
  password?: string        // credentials users only
  authProvider: 'google' | 'credentials'
  emailVerified: boolean
  createdAt: Date
}

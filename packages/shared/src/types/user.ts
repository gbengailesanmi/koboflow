export type AuthProvider = 'google' | 'credentials'

export interface CustomerDetailsFromMono {
  full_name: string
  bvn: string
  phone: string
  gender: string | null
  dob: string | null
  address_line1: string
  address_line2: string
  marital_status: string | null
  created_at: string
  updated_at: string
}

export interface User {
  _id?: unknown
  customerId: string
  email: string
  firstName?: string
  lastName?: string
  emailVerified: boolean
  authProvider: AuthProvider
  createdAt: Date
  
  // Mono customer details (populated when user links first account)
  customerDetailsFromMono?: CustomerDetailsFromMono
  customerDetailsLastUpdated?: Date
}
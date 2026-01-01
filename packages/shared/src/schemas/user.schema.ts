import { z } from 'zod'

export const AuthProviderSchema = z.enum(['google', 'credentials'])

// Customer details fetched from Mono (KYC data)
export const CustomerDetailsFromMonoSchema = z.object({
  full_name: z.string(),
  bvn: z.string(),
  phone: z.string(),
  gender: z.string().nullable(),
  dob: z.string().nullable(),
  address_line1: z.string(),
  address_line2: z.string(),
  marital_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

export const UserSchema = z.object({
  _id: z.unknown().optional(),
  customerId: z.string().min(1),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  emailVerified: z.boolean().default(false),
  authProvider: AuthProviderSchema,
  createdAt: z.date().default(() => new Date()),
  
  // Mono customer details (added when user links their first account)
  customerDetailsFromMono: CustomerDetailsFromMonoSchema.optional(),
  customerDetailsLastUpdated: z.date().optional(),
  
  // For credentials auth
  password: z.string().optional(),
  verificationToken: z.string().optional(),
  verificationTokenExpiry: z.date().optional(),
  verifiedAt: z.date().optional(),
})

export const CreateUserSchema = UserSchema.omit({ 
  _id: true, 
  createdAt: true,
  customerDetailsFromMono: true,
  customerDetailsLastUpdated: true,
})

export const UpdateUserSchema = UserSchema.partial().omit({ 
  _id: true, 
  customerId: true, 
  authProvider: true,
  password: true,
  verificationToken: true,
  verificationTokenExpiry: true,
})

// Schema for updating profile (user-editable fields only)
export const UpdateUserProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
})

export type CustomerDetailsFromMonoType = z.infer<typeof CustomerDetailsFromMonoSchema>
export type UserSchemaType = z.infer<typeof UserSchema>
export type CreateUserSchemaType = z.infer<typeof CreateUserSchema>
export type UpdateUserSchemaType = z.infer<typeof UpdateUserSchema>
export type UpdateUserProfileSchemaType = z.infer<typeof UpdateUserProfileSchema>

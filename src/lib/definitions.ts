import { z } from 'zod'

export const SignupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email').trim(),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[a-zA-Z]/, 'Include a letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^a-zA-Z0-9]/, 'Include a special character')
})

export type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined

export type SessionPayload = {
  userId: string | number
  expiresAt: Date
}
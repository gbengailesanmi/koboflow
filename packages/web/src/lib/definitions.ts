// Re-export validation schemas from shared package
export { SignupFormSchema, LoginFormSchema, type SignupFormData, type LoginFormData } from '@money-mapper/shared'

export type FormState = {
  errors?: {
    firstName?: string[]
    lastName?: string[]
    email?: string[]
    password?: string[]
    passwordConfirm?: string[]
  }
  message?: string
  success?: boolean
  customerId?: string
  requiresVerification?: boolean
} | undefined

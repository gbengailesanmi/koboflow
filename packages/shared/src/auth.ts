import { z } from 'zod'

export const SignupFormSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string().min(8),
})

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type SignupFormData = z.infer<typeof SignupFormSchema>
export type LoginFormData = z.infer<typeof LoginFormSchema>

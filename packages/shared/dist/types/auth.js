import { z } from 'zod';
export const SignupFormSchema = z.object({
    firstName: z.string().min(2, 'First name must be at least 2 characters').trim(),
    lastName: z.string().min(2, 'Last name must be at least 2 characters').trim(),
    email: z.email('Invalid email').trim(),
    password: z.string()
        .min(8, 'At least 8 characters')
        .regex(/[a-zA-Z]/, 'Include a letter')
        .regex(/[0-9]/, 'Include a number')
        .regex(/[^a-zA-Z0-9]/, 'Include a special character'),
    passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
    message: 'Passwords do not match',
    path: ['passwordConfirm']
});

import { z } from 'zod';
export declare const SignupFormSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    email: z.ZodEmail;
    password: z.ZodString;
    passwordConfirm: z.ZodString;
}, z.core.$strip>;
export type FormState = {
    errors?: {
        firstName?: string[];
        lastName?: string[];
        email?: string[];
        password?: string[];
        passwordConfirm?: string[];
    };
    message?: string;
    success?: boolean;
    customerId?: string;
    requiresVerification?: boolean;
} | undefined;
export type SessionPayload = {
    userId: string | number;
    expiresAt: Date;
};
//# sourceMappingURL=auth.d.ts.map
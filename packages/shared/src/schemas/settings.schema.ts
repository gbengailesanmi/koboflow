import { z } from 'zod'

export const AppearanceSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('system'),
  pageBgColours: z.array(z.string()).default([]),
  reducedMotion: z.boolean().default(false),
})

export const NotificationsSchema = z.object({
  budgetAlerts: z.boolean().default(true),
  weeklyBudgetReports: z.boolean().default(false),
  monthlyReports: z.boolean().default(true),
  weeklyTransactionReports: z.boolean().default(false),
  transactionAlerts: z.boolean().default(true),
  weeklyInsightReports: z.boolean().default(false),
})

export const ReceiveOnSchema = z.object({
  email: z.boolean().default(true),
  sms: z.boolean().default(false),
})

export const SecuritySchema = z.object({
  faceId: z.boolean().default(false),
  pinHash: z.string().optional(),
  givePermission: z.boolean().default(false),
})

export const PrivacySchema = z.object({
  showBalance: z.boolean().default(true),
})

export const UserSettingsSchema = z.object({
  customerId: z.string().min(1),
  dateFormat: z.string().default('DD/MM/YYYY'),
  appearance: AppearanceSchema,
  notifications: NotificationsSchema,
  receiveOn: ReceiveOnSchema,
  currency: z.string().default('NGN'),
  security: SecuritySchema,
  privacy: PrivacySchema,
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const CreateUserSettingsSchema = UserSettingsSchema.omit({ createdAt: true, updatedAt: true })

export const UpdateUserSettingsSchema = UserSettingsSchema.partial().omit({ customerId: true }).extend({
  updatedAt: z.date().default(() => new Date()),
})

export type UserSettingsSchemaType = z.infer<typeof UserSettingsSchema>
export type CreateUserSettingsSchemaType = z.infer<typeof CreateUserSettingsSchema>
export type UpdateUserSettingsSchemaType = z.infer<typeof UpdateUserSettingsSchema>

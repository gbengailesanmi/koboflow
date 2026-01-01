import { z } from 'zod'

export const MonoInstitutionSchema = z.object({
  name: z.string(),
  bank_code: z.string(),
  type: z.string(),
})

export const MonoAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  currency: z.string(),
  type: z.string(),
  account_number: z.string(),
  balance: z.number(),
  bvn: z.string().nullable(),
  institution: MonoInstitutionSchema,
})

export const MonoCustomerSchema = z.object({
  id: z.string(),
})

export const MonoMetaSchema = z.object({
  data_status: z.enum(['AVAILABLE', 'PARTIAL', 'UNAVAILABLE', 'FAILED', 'PROCESSING']),
  auth_method: z.string(),
  data_request_id: z.string().optional(),
  session_id: z.string().optional(),
  retrieved_data: z.array(z.string()).optional(),
})

export const MonoAccountResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  data: z.object({
    account: MonoAccountSchema,
    customer: MonoCustomerSchema,
    meta: MonoMetaSchema,
  }),
})

export const AccountSchema = MonoAccountSchema.extend({
  customerId: z.string().min(1),
  monoCustomerId: z.string().optional(),
  lastRefreshed: z.date().default(() => new Date()),
  provider: z.literal('mono'),
  meta: MonoMetaSchema.optional(),
})

export const CreateAccountSchema = AccountSchema.omit({ lastRefreshed: true })

export const UpdateAccountSchema = AccountSchema.partial().required({ id: true })

export type MonoAccountSchemaType = z.infer<typeof MonoAccountSchema>
export type MonoCustomerSchemaType = z.infer<typeof MonoCustomerSchema>
export type MonoMetaSchemaType = z.infer<typeof MonoMetaSchema>
export type AccountSchemaType = z.infer<typeof AccountSchema>
export type CreateAccountSchemaType = z.infer<typeof CreateAccountSchema>
export type UpdateAccountSchemaType = z.infer<typeof UpdateAccountSchema>

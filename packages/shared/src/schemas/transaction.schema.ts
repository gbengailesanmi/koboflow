import { z } from 'zod'

export const MonoTransactionSchema = z.object({
  id: z.string(),
  narration: z.string(),
  amount: z.number(),
  type: z.enum(['debit', 'credit']),
  balance: z.number(),
  date: z.string(),
  category: z.string().nullable(),
})

export const EnrichedTransactionSchema = z.object({
  id: z.string(),
  narration: z.string(),
  amount: z.number(),
  type: z.enum(['debit', 'credit']),
  balance: z.number(),
  date: z.string(),
  category: z.string(),
  accountId: z.string(),
  customerId: z.string(),
  accountNumber: z.string().optional(),
  bankCode: z.string().optional(),
  hash: z.string().optional(),
})

export const MonoTransactionMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  previous: z.string().nullable(),
  next: z.string().nullable(),
})

export const MonoTransactionsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  data: z.array(MonoTransactionSchema),
  meta: MonoTransactionMetaSchema,
})

export const TransactionsResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  timestamp: z.string(),
  data: z.array(EnrichedTransactionSchema),
  meta: MonoTransactionMetaSchema,
})

export const CreateTransactionSchema = EnrichedTransactionSchema.omit({ hash: true })

export const UpdateTransactionSchema = EnrichedTransactionSchema.partial().required({ id: true })

export type MonoTransactionSchemaType = z.infer<typeof MonoTransactionSchema>
export type EnrichedTransactionSchemaType = z.infer<typeof EnrichedTransactionSchema>
export type CreateTransactionSchemaType = z.infer<typeof CreateTransactionSchema>
export type UpdateTransactionSchemaType = z.infer<typeof UpdateTransactionSchema>

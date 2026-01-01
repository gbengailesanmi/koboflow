import { z } from 'zod'

export const CategoryBudgetSchema = z.object({
  category: z.string().min(1),
  limit: z.number().min(0),
  customName: z.string().optional(),
  spent: z.number().optional(),
  percentage: z.number().optional(),
})

export const BudgetPeriodTypeSchema = z.enum(['current-month', 'custom-date', 'recurring'])

export const BudgetPeriodSchema = z.object({
  type: BudgetPeriodTypeSchema,
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  recurringInterval: z.number().optional(),
  recurringUnit: z.enum(['days', 'months', 'years']).optional(),
})

export const BudgetSchema = z.object({
  _id: z.string().optional(),
  customerId: z.string().min(1),
  name: z.string().min(1),
  isActive: z.boolean().default(true),
  totalBudgetLimit: z.number().min(0),
  period: BudgetPeriodSchema.optional(),
  categories: z.array(CategoryBudgetSchema),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const CreateBudgetSchema = BudgetSchema.omit({ _id: true, createdAt: true, updatedAt: true })

export const UpdateBudgetSchema = BudgetSchema.partial().omit({ _id: true, customerId: true }).extend({
  updatedAt: z.date().default(() => new Date()),
})

export type CategoryBudgetSchemaType = z.infer<typeof CategoryBudgetSchema>
export type BudgetPeriodSchemaType = z.infer<typeof BudgetPeriodSchema>
export type BudgetSchemaType = z.infer<typeof BudgetSchema>
export type CreateBudgetSchemaType = z.infer<typeof CreateBudgetSchema>
export type UpdateBudgetSchemaType = z.infer<typeof UpdateBudgetSchema>

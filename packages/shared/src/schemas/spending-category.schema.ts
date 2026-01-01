import { z } from 'zod'

export const SpendingCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  keywords: z.array(z.string()),
  color: z.string(),
  isDefault: z.boolean().default(false),
  isEditable: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const UserSpendingCategoriesSchema = z.object({
  _id: z.string().optional(),
  customerId: z.string().min(1),
  categories: z.array(SpendingCategorySchema),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
})

export const SpendingCategoryInputSchema = z.object({
  name: z.string().min(1),
  keywords: z.array(z.string()).min(1),
  color: z.string().optional(),
})

export const CreateSpendingCategorySchema = SpendingCategorySchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateSpendingCategorySchema = SpendingCategorySchema.partial().required({ id: true }).extend({
  updatedAt: z.date().default(() => new Date()),
})

export const CreateUserSpendingCategoriesSchema = UserSpendingCategoriesSchema.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
})

export const UpdateUserSpendingCategoriesSchema = UserSpendingCategoriesSchema.partial().omit({ 
  _id: true, 
  customerId: true 
}).extend({
  updatedAt: z.date().default(() => new Date()),
})

export type SpendingCategorySchemaType = z.infer<typeof SpendingCategorySchema>
export type UserSpendingCategoriesSchemaType = z.infer<typeof UserSpendingCategoriesSchema>
export type SpendingCategoryInputSchemaType = z.infer<typeof SpendingCategoryInputSchema>
export type CreateSpendingCategorySchemaType = z.infer<typeof CreateSpendingCategorySchema>
export type UpdateSpendingCategorySchemaType = z.infer<typeof UpdateSpendingCategorySchema>

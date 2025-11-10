import type { CustomCategory } from '@/types/custom-category'

export interface CategoriesSlice {
  categories: CustomCategory[] | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setCategories: (categories: CustomCategory[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCategories: () => void
}

export const createCategoriesSlice = (set: any): CategoriesSlice => ({
  categories: null,
  isLoading: false,
  error: null,
  
  setCategories: (categories) => set({ categories, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearCategories: () => set({ categories: null, error: null, isLoading: false }),
})

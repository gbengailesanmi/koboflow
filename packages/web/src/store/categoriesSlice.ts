export interface Category {
  name: string
  customName?: string
}

export interface CategoriesSlice {
  categories: Category[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setCategories: (categories: Category[]) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearCategories: () => void
}

export const createCategoriesSlice = (set: any): CategoriesSlice => ({
  categories: [],
  isLoading: false,
  error: null,
  
  setCategories: (categories) => set({ categories, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearCategories: () => set({ categories: [], error: null, isLoading: false }),
})

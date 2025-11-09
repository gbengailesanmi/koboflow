export interface User {
  customerId: string
  firstName: string
  lastName: string
  email: string
  currency: string
  totalBudgetLimit: number
}

export interface SessionSlice {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearSession: () => void
}

export const createSessionSlice = (set: any): SessionSlice => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user, 
    error: null 
  }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearSession: () => set({ 
    user: null, 
    isAuthenticated: false, 
    error: null, 
    isLoading: false 
  }),
})

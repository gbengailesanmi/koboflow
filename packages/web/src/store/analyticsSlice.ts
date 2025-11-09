export interface AnalyticsData {
  [key: string]: any // Flexible structure for various analytics data
}

export interface AnalyticsSlice {
  data: AnalyticsData
  isLoading: boolean
  error: string | null
  
  // Actions
  setAnalyticsData: (key: string, value: any) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearAnalytics: () => void
}

export const createAnalyticsSlice = (set: any, get: any): AnalyticsSlice => ({
  data: {},
  isLoading: false,
  error: null,
  
  setAnalyticsData: (key, value) => set((state: AnalyticsSlice) => ({
    data: { ...state.data, [key]: value },
    error: null
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearAnalytics: () => set({ data: {}, error: null, isLoading: false }),
})

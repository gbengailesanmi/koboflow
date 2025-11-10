import { apiCacheManager } from './api-cache'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface ApiResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  [key: string]: any
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Main request method with integrated caching
   * - GET requests are cached and served from cache if available
   * - Mutation requests (POST, PATCH, DELETE) invalidate related cache entries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const method = options.method || 'GET'
    const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)
    
    // Try to get from cache for GET requests
    if (method === 'GET') {
      const cached = apiCacheManager.get<T>(endpoint, options)
      if (cached) {
        return cached
      }
    }
    
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      
      if (response.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    const data = await response.json()
    
    // Cache GET responses
    if (method === 'GET') {
      apiCacheManager.set(endpoint, data, options)
    }
    
    // Invalidate cache on mutations
    if (isMutation) {
      apiCacheManager.invalidateOnMutation(endpoint)
    }
    
    return data
  }

  async getBudget() {
    return this.request('/api/budget')
  }

  async createBudget(data: {
    totalBudgetLimit: number
    categories: any[]
    period?: any
  }) {
    return this.request('/api/budget', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateBudget(data: Partial<{
    totalBudgetLimit: number
    categories: any[]
    period: any
  }>) {
    return this.request('/api/budget', {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getCategories() {
    return this.request('/api/categories')
  }

  async createCategory(data: {
    name: string
    keywords: string[]
    color?: string
  }) {
    return this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCategory(id: string, data: {
    name?: string
    keywords?: string[]
    color?: string
  }) {
    return this.request(`/api/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteCategory(id: string) {
    return this.request(`/api/categories/${id}`, {
      method: 'DELETE',
    })
  }

  async getSettings() {
    return this.request('/api/settings')
  }

  async updateSettings(data: any) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteAccount(customerId?: string) {
    return this.request('/api/settings/account', {
      method: 'DELETE',
      body: customerId ? JSON.stringify({ customerId }) : undefined,
    })
  }

  async signup(data: {
    firstName: string
    lastName: string
    email: string
    password: string
    passwordConfirm: string
  }) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: {
    email: string
    password: string
  }) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async verifyEmail(token: string) {
    return this.request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  }

  async resendVerification(email: string) {
    return this.request('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', {
        method: 'POST',
      })
      
      // Clear store on logout (handled in hook)
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  }

  async updateProfile(customerId: string, data: {
    firstName: string
    lastName: string
    email: string
    currency?: string
    totalBudgetLimit?: number
  }): Promise<ApiResponse> {
    return this.request<ApiResponse>(`/api/auth/user/${customerId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async getSession() {
    return this.request('/api/session')
  }

  async getTransactions() {
    return this.request('/api/transactions')
  }

  async getAccounts() {
    return this.request('/api/accounts')
  }

  async refreshAccounts() {
    return this.request('/api/accounts/refresh', {
      method: 'POST',
    })
  }

  async handleTinkCallback(code: string) {
    return this.request(`/api/callback?code=${code}`)
  }
}

export const apiClient = new ApiClient()

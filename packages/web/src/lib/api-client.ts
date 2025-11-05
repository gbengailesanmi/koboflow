const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Response types
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include HTTP-only cookies in requests
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      
      // If unauthorized, redirect to login
      if (response.status === 401 && typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Budget APIs
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

  // Categories APIs
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

  // Settings APIs
  async getSettings() {
    return this.request('/api/settings')
  }

  async updateSettings(data: any) {
    return this.request('/api/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async deleteAccount() {
    return this.request('/api/settings/account', {
      method: 'DELETE',
    })
  }

  // Auth APIs
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
    } finally {
      // Cookie is cleared by the backend
      // Just redirect to login
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

  // Session API
  async getSession() {
    return this.request('/api/session')
  }

  // Transactions API
  async getTransactions() {
    return this.request('/api/transactions')
  }

  // Accounts API
  async getAccounts() {
    return this.request('/api/accounts')
  }

  async refreshAccounts() {
    return this.request('/api/accounts/refresh', {
      method: 'POST',
    })
  }

  // Tink Callback
  async handleTinkCallback(code: string) {
    return this.request(`/api/callback?code=${code}`)
  }
}

export const apiClient = new ApiClient()

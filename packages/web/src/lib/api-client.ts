const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

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
      credentials: 'include',
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
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

  // Session API
  async getSession() {
    return this.request('/api/session')
  }

  // Tink Callback
  async handleTinkCallback(code: string) {
    return this.request(`/api/callback?code=${code}`)
  }
}

export const apiClient = new ApiClient()

export interface UserSettings {
  customerId: string
  dateFormat: string
  appearance: {
    theme: 'light' | 'dark' | 'system'
    pageBgColours: string[]
    reducedMotion: boolean
  }
  notifications: {
    budgetAlerts: boolean
    weeklyBudgetReports: boolean
    monthlyReports: boolean
    weeklyTransactionReports: boolean
    transactionAlerts: boolean
    weeklyInsightReports: boolean
  }
  receiveOn: {
    email: boolean
    sms: boolean
  }
  currency: string
  security: {
    faceId: boolean
    pinHash?: string
    givePermission: boolean
  }
  privacy: {
    showBalance: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export interface SettingsUpdate {
  dateFormat?: string
  appearance?: Partial<UserSettings['appearance']>
  notifications?: Partial<UserSettings['notifications']>
  receiveOn?: Partial<UserSettings['receiveOn']>
  currency?: 'NGN'
  security?: Partial<UserSettings['security']>
  privacy?: Partial<UserSettings['privacy']>
}

export const ACCENT_COLORS = [
  '#D92626', // hsl(0, 70%, 50%)    - Red
  '#D99126', // hsl(36, 70%, 50%)   - Orange
  '#B5D926', // hsl(72, 70%, 50%)   - Yellow-Green
  '#4AD926', // hsl(108, 70%, 50%)  - Green
  '#26D96E', // hsl(144, 70%, 50%)  - Teal
  '#26D9D9', // hsl(180, 70%, 50%)  - Cyan
  '#266ED9', // hsl(216, 70%, 50%)  - Blue
  '#4A26D9', // hsl(252, 70%, 50%)  - Indigo
  '#B526D9', // hsl(288, 70%, 50%)  - Purple
  '#D92691',
] as const

export const DEFAULT_SETTINGS: Omit<UserSettings, 'customerId' | 'createdAt' | 'updatedAt'> = {
  dateFormat: 'dd/MM/yyyy',
  appearance: {
    theme: 'light',
    pageBgColours: [...ACCENT_COLORS],
    reducedMotion: false,
  },
  notifications: {
    budgetAlerts: true,
    weeklyBudgetReports: false,
    monthlyReports: false,
    weeklyTransactionReports: false,
    transactionAlerts: true,
    weeklyInsightReports: false,
  },
  receiveOn: {
    email: true,
    sms: false,
  },
  currency: 'NGN',
  security: {
    faceId: false,
    givePermission: false,
  },
  privacy: {
    showBalance: true,
  },
}

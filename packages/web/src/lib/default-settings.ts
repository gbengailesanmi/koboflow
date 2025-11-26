

export const DEFAULT_SETTINGS = {
  theme: 'system' as 'light' | 'dark' | 'system',
  accentColor: 'blue' as string,
  
  pageColors: {
    analytics: '#8B7DAB',    // Purple
    budget: '#86B0AA',       // Green
    profile: '#f59e0b',      // Amber
    settings: '#7D7DBD',     // Indigo
    transactions: '#966F83', // Pink
    dashboard: '#245cd4',    // Blue
  },
  
  notifications: {
    email: {
      budgetAlerts: true,
      weeklyReport: true,
      monthlyReport: true,
      transactionAlerts: false,
    },
    push: {
      enabled: false,
      budgetAlerts: false,
      transactionAlerts: false,
    },
  },
  
  display: {
    dateFormat: 'DD/MM/YYYY' as string,
    timeFormat: '24h' as '12h' | '24h',
    compactView: false,
    showDecimals: true,
  },
  
  privacy: {
    showBalance: true,
    showTransactions: true,
    analyticsTracking: true,
    dataSharing: false,
  },
  
  budget: {
    defaultPeriod: 'monthly' as 'weekly' | 'monthly' | 'yearly',
    carryOverUnspent: false,
    alertThreshold: 80, // percentage
    showProjections: true,
  },
  
  transactions: {
    defaultView: 'all' as 'all' | 'income' | 'expense',
    groupByDate: true,
    showCategories: true,
    autoCategorizationEnabled: true,
  },
  
  createdAt: new Date(),
  updatedAt: new Date(),
} as const

export type UserSettings = typeof DEFAULT_SETTINGS

export type SettingsUpdate = Partial<{
  theme: 'light' | 'dark' | 'system'
  accentColor: string
  pageColors: Partial<typeof DEFAULT_SETTINGS.pageColors>
  notifications: Partial<typeof DEFAULT_SETTINGS.notifications>
  display: Partial<typeof DEFAULT_SETTINGS.display>
  privacy: Partial<typeof DEFAULT_SETTINGS.privacy>
  budget: Partial<typeof DEFAULT_SETTINGS.budget>
  transactions: Partial<typeof DEFAULT_SETTINGS.transactions>
}>

export const PAGE_COLORS = {
  analytics: '#8b5cf6',    // Purple - for analytics/insights
  budget: '#10b981',       // Green - for budget/money management  
  profile: '#f59e0b',      // Amber - for profile/personal
  settings: '#6366f1',     // Indigo - for settings/configuration
  transactions: '#ec4899', // Pink - for transactions/activity
  dashboard: '#245cd4',    // Blue - for dashboard (dynamic via provider)
} as const

export type PageName = keyof typeof PAGE_COLORS

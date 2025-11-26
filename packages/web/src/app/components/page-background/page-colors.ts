export const PAGE_COLORS = {
  analytics: '#8B7DAB',    // Purple - for analytics/insights
  budget: '#86B0AA',       // Green - for budget/money management  
  profile: '#f59e0b',      // Amber - for profile/personal
  settings: '#7D7DBD',     // Indigo - for settings/configuration
  transactions: '#966F83', // Pink - for transactions/activity
  dashboard: '#245cd4',    // Blue - for dashboard (dynamic via provider)
} as const

export type PageName = keyof typeof PAGE_COLORS

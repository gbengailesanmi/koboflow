import { usePathname } from 'next/navigation'

export type CurrentPage = 'dashboard' | 'analytics' | 'budget' | 'transactions' | 'settings' | null

export function useCurrentPage(): CurrentPage {
  const pathname = usePathname()

  if (pathname.includes('/dashboard')) return 'dashboard'
  if (pathname.includes('/analytics')) return 'analytics'
  if (pathname.includes('/budget')) return 'budget'
  if (pathname.includes('/transactions')) return 'transactions'
  if (pathname.includes('/settings')) return 'settings'
  
  return null
}

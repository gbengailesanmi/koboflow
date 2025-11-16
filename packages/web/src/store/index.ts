/**
 * ZUSTAND STORE - UI STATE ONLY
 * 
 * This store manages ONLY UI state (selections, toggles, filters, preferences).
 * API data is fetched via api-service.ts and cached automatically by Next.js.
 * 
 * ⚠️ DO NOT store API data here (accounts, transactions, budget, etc.)
 * ⚠️ Data caching is handled by Next.js Server Components and fetch cache
 * 
 * Why this approach?
 * - Server Components fetch data on the server (better performance)
 * - Next.js caches fetch requests automatically
 * - No need for client-side data caching layer
 * - Zustand only manages ephemeral UI state
 * 
 * Usage:
 * ```tsx
 * // Server Component (fetches data)
 * async function DashboardPage() {
 *   const accounts = await getAccounts()  // Cached by Next.js
 *   return <DashboardClient accounts={accounts} />
 * }
 * 
 * // Client Component (uses UI store)
 * 'use client'
 * function DashboardClient({ accounts }) {
 *   const { selectedAccountId, setSelectedAccount } = useUIStore()
 *   // Use accounts from props, UI state from Zustand
 * }
 * ```
 */

export { useUIStore } from './ui-store'

/**
 * Mono Connect Widget Hook
 * Provides a React hook for integrating Mono Connect widget
 */

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { exchangeMonoToken, importMonoAccount, syncMonoTransactions } from '@/app/api/api-service'
import config from '@/config'

interface UseMonoConnectOptions {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function useMonoConnect({ onSuccess, onError }: UseMonoConnectOptions = {}) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const openMonoWidget = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const Connect = (await import('@mono.co/connect.js')).default

      const monoInstance = new Connect({
        key: config.MONO_PUBLIC_KEY,
        scope: 'auth',
        
        onSuccess: async ({ code }: { code: string }) => {
          console.log('[Mono Widget] Received code:', code)
          
          try {
            console.log('[Mono Widget] Exchanging token...')
            const tokenResult = await exchangeMonoToken(code)
            
            if (!tokenResult.success || !tokenResult.accountId) {
              throw new Error(tokenResult.message || 'Failed to exchange token')
            }

            const accountId = tokenResult.accountId
            console.log('[Mono Widget] Got accountId:', accountId)

            console.log('[Mono Widget] Importing account...')
            const importResult = await importMonoAccount(accountId)
            
            if (!importResult.success) {
              throw new Error(importResult.message || 'Failed to import account')
            }

            console.log('[Mono Widget] Account imported successfully!')

            console.log('[Mono Widget] Fetching transactions...')
            const transactionsResult = await syncMonoTransactions(accountId)
            
            if (transactionsResult.success) {
              console.log(`[Mono Widget] Successfully synced ${transactionsResult.transactionsCount || 0} transactions`)
            } else {
              console.warn('[Mono Widget] Transaction sync failed:', transactionsResult.message)
            }

            console.log('[Mono Widget] Account linked successfully!')
            onSuccess?.()
            
            router.refresh()
          } catch (error: any) {
            console.error('[Mono Widget] Error processing account:', error)
            onError?.(error.message || 'Failed to link account')
          } finally {
            setIsLoading(false)
          }
        },

        onClose: () => {
          console.log('[Mono Widget] Widget closed')
          setIsLoading(false)
        },

        onLoad: () => {
          console.log('[Mono Widget] Widget loaded')
        },

        onEvent: (eventName: string, data: any) => {
          console.log('[Mono Widget] Event:', eventName, data)
        },
      })

      monoInstance.setup()
      monoInstance.open()
    } catch (error: any) {
      console.error('[Mono Widget] Failed to open widget:', error)
      onError?.(error.message || 'Failed to open Mono widget')
      setIsLoading(false)
    }
  }, [router, onSuccess, onError])

  return {
    openMonoWidget,
    isLoading,
  }
}

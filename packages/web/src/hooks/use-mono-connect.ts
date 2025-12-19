/**
 * Mono Connect Widget Hook
 * Provides a React hook for integrating Mono Connect widget
 */

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { processMonoConnection } from '@/app/actions/mono-actions'
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
            const result = await processMonoConnection(code)
            
            if (!result.success) {
              throw new Error(result.message || 'Failed to link account')
            }
            
            console.log(`[Mono Widget] Successfully synced ${result.transactionsCount || 0} transactions`)
            onSuccess?.()
            router.refresh()
          } catch (error: any) {
            console.error('[Mono Widget] Error:', error)
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

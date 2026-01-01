'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { monoProcessConnectionAction } from '@/app/actions/mono-actions'
import { logger } from '@money-mapper/shared'
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

      const monoKey = config.MONO_PUBLIC_KEY
      if (!monoKey) {
        throw new Error('MONO_PUBLIC_KEY is not configured')
      }

      const Connect = (await import('@mono.co/connect.js')).default

      const monoInstance = new Connect({
        key: monoKey,
        scope: 'auth',

        onSuccess: async ({ code }: { code: string }) => {
          try {
            const result = await monoProcessConnectionAction(code)

            if (!result.success) {
              throw new Error(result.message || 'Failed to link account')
            }
            
            onSuccess?.()
            router.refresh()
          } catch (error: any) {
            logger.error({ module: 'mono-connect', error }, 'Mono widget error')
            onError?.(error.message || 'Failed to link account')
          } finally {
            setIsLoading(false)
          }
        },

        onClose: () => {
          setIsLoading(false)
        },

        onLoad: () => {
        },

        onEvent: (eventName: string, data: any) => {
        },
      })

      monoInstance.setup()
      monoInstance.open()
    } catch (error: any) {
      logger.error({ module: 'mono-connect', error }, 'Failed to open Mono widget')
      onError?.(error.message || 'Failed to open Mono widget')
      setIsLoading(false)
    }
  }, [router, onSuccess, onError])

  return {
    openMonoWidget,
    isLoading,
  }
}

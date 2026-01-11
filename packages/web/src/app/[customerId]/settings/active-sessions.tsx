'use client'

import { useActiveSessions } from '@/hooks/use-data'
import { revokeSessionAction, logoutAllDevicesAction } from '@/app/actions/session.actions'
import { runAction } from '@/lib/actions/run-action'
import { Box, Text, Flex, Button } from '@radix-ui/themes'
import { LaptopIcon, MobileIcon, Cross2Icon } from '@radix-ui/react-icons'
import { useState } from 'react'
import styles from './settings.module.css'

function parseUserAgent(userAgent?: string) {
  if (!userAgent) return { device: 'Unknown Device', browser: 'Unknown Browser' }

  const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
  const isTablet = /iPad|Tablet/i.test(userAgent)
  
  let device = 'Desktop'
  if (isTablet) device = 'Tablet'
  else if (isMobile) device = 'Mobile'

  let browser = 'Unknown Browser'
  if (userAgent.includes('Chrome')) browser = 'Chrome'
  else if (userAgent.includes('Safari')) browser = 'Safari'
  else if (userAgent.includes('Firefox')) browser = 'Firefox'
  else if (userAgent.includes('Edge')) browser = 'Edge'

  return { device, browser }
}

function formatTimeAgo(date: Date | string) {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return past.toLocaleDateString()
}

export default function ActiveSessions() {
  const { data, error, isLoading } = useActiveSessions()
  const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
  const [isLogoutAllLoading, setIsLogoutAllLoading] = useState(false)

  const handleLogoutSession = async (sessionId: string) => {
    setLoadingSessionId(sessionId)
    
    await runAction(revokeSessionAction, sessionId)
    
    setLoadingSessionId(null)
  }

  const handleLogoutAll = async () => {
    const confirmed = window.confirm(
      'This will log you out from all devices except this one. Continue?'
    )
    
    if (!confirmed) return

    setIsLogoutAllLoading(true)
    
    await runAction(logoutAllDevicesAction)
    
    setIsLogoutAllLoading(false)
  }

  if (isLoading) {
    return (
      <Box className={styles.settingsCard} p="4">
        <Text size="2" color="gray">Loading sessions...</Text>
      </Box>
    )
  }

  if (error || !data?.success) {
    console.log('fvdfdf', error)
    return (
      <Box className={styles.settingsCard} p="4">
        <Text size="2" color="red">Failed to load sessions</Text>
      </Box>
    )
  }

  const sessions = data.sessions || []

  return (
    <Box>
      <Box className={styles.settingsCard}>
        {sessions.length === 0 ? (
          <Box p="4">
            <Text size="2" color="gray">No active sessions found</Text>
          </Box>
        ) : (
          sessions.map((session, index) => {
            const { device, browser } = parseUserAgent(session.userAgent)
            const isLoading = loadingSessionId === session.sessionId

            return (
              <div key={session.sessionId}>
                <Flex justify="between" align="center" p="3">
                  <Flex align="center" gap="3" style={{ flex: 1 }}>
                    <div className={styles.settingIcon}>
                      {device === 'Mobile' ? (
                        <MobileIcon width="18" height="18" />
                      ) : (
                        <LaptopIcon width="18" height="18" />
                      )}
                    </div>
                    <Flex direction="column" gap="1">
                      <Text size="3" weight="medium">
                        {device} • {browser}
                      </Text>
                      <Text size="2" color="gray">
                        Logged in {formatTimeAgo(session.createdAt)}
                        {session.lastActivity && ` • Active ${formatTimeAgo(session.lastActivity)}`}
                      </Text>
                    </Flex>
                  </Flex>
                  <Button
                    variant="ghost"
                    color="red"
                    size="1"
                    onClick={() => handleLogoutSession(session.sessionId)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Text size="2">...</Text>
                    ) : (
                      <Cross2Icon width="14" height="14" />
                    )}
                  </Button>
                </Flex>
                {index < sessions.length - 1 && <div className={styles.divider} />}
              </div>
            )
          })
        )}
      </Box>

      {sessions.length > 1 && (
        <Box mt="3">
          <Button
            variant="soft"
            color="red"
            size="2"
            onClick={handleLogoutAll}
            disabled={isLogoutAllLoading}
            style={{ width: '100%' }}
          >
            {isLogoutAllLoading ? 'Logging out...' : 'Logout All Devices'}
          </Button>
        </Box>
      )}
    </Box>
  )
}

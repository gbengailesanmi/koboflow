// packages/shared/src/types/session.ts

export type SessionRecord = {
  sessionId: string
  customerId: string
  createdAt: Date
  expiresAt: Date
  userAgent?: string
  ipAddress?: string
}

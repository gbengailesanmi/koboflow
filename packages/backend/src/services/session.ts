import { randomUUID } from 'crypto'
import { connectDB } from '../db/mongo'

export interface SessionData {
  sessionId: string
  customerId: string
  email: string
  firstName?: string
  lastName?: string
  createdAt: Date
  expiresAt: Date
  lastAccessedAt: Date
  userAgent?: string
  ipAddress?: string
}

/**
 * Create a new session
 */
export async function createSession(
  customerId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const db = await connectDB()
  const sessionId = randomUUID()
  
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const sessionData: SessionData = {
    sessionId,
    customerId,
    email,
    firstName,
    lastName,
    createdAt: new Date(),
    expiresAt,
    lastAccessedAt: new Date(),
    userAgent,
    ipAddress,
  }
  
  await db.collection('sessions').insertOne(sessionData)
  
  console.log(`[Session] Created session ${sessionId} for user ${email}`)
  
  return sessionId
}

/**
 * Get session by ID
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
  const db = await connectDB()
  
  const session = await db.collection('sessions').findOne({ 
    sessionId,
    expiresAt: { $gt: new Date() } // Only return non-expired sessions
  })
  
  if (session) {
    // Update last accessed time
    await db.collection('sessions').updateOne(
      { sessionId },
      { $set: { lastAccessedAt: new Date() } }
    )
  }
  
  return session
}

/**
 * Delete a specific session (logout)
 */
export async function deleteSession(sessionId: string): Promise<boolean> {
  const db = await connectDB()
  
  const result = await db.collection('sessions').deleteOne({ sessionId })
  
  console.log(`[Session] Deleted session ${sessionId}`)
  
  return result.deletedCount > 0
}

/**
 * Delete all sessions for a user (logout all devices)
 */
export async function deleteAllUserSessions(customerId: string): Promise<number> {
  const db = await connectDB()
  
  const result = await db.collection('sessions').deleteMany({ customerId })
  
  console.log(`[Session] Deleted ${result.deletedCount} sessions for user ${customerId}`)
  
  return result.deletedCount
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(customerId: string): Promise<SessionData[]> {
  const db = await connectDB()
  
  const sessions = await db.collection('sessions').find({ 
    customerId,
    expiresAt: { $gt: new Date() }
  }).toArray() as SessionData[]
  
  return sessions
}

/**
 * Clean up expired sessions (run periodically)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const db = await connectDB()
  
  const result = await db.collection('sessions').deleteMany({
    expiresAt: { $lte: new Date() }
  })
  
  console.log(`[Session] Cleaned up ${result.deletedCount} expired sessions`)
  
  return result.deletedCount
}

/**
 * Extend session expiry
 */
export async function extendSession(sessionId: string, days: number = 7): Promise<boolean> {
  const db = await connectDB()
  
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  
  const result = await db.collection('sessions').updateOne(
    { sessionId },
    { 
      $set: { 
        expiresAt,
        lastAccessedAt: new Date()
      } 
    }
  )
  
  return result.modifiedCount > 0
}

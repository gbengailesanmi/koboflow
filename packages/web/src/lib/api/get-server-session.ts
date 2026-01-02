// packages/web/src/lib/server/get-server-session.ts
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { authOptions } from '../auth/authOptions'

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}

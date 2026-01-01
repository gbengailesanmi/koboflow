// packages/web/src/lib/server/get-server-session.ts
import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}

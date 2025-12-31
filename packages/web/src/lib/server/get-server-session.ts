// packages/web/src/lib/server/get-server-session.ts
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function getAuthSession() {
  return getServerSession(authOptions)
}

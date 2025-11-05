import { auth } from '@/auth'

export async function getSession() {
  const session = await auth()
  
  if (!session?.user?.customerId) {
    return null
  }
  
  return {
    customerId: session.user.customerId as string,
    email: session.user.email as string,
    name: session.user.name as string,
  }
}

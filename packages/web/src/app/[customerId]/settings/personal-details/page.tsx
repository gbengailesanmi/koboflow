import { getServerSession } from '@/lib/server/get-server-session'
import { redirect } from 'next/navigation'
import PersonalDetailsClient from './personal-details-client'

export default async function PersonalDetailsPage({
  params,
}: {
  params: Promise<{ customerId: string }>
}) {
  const { customerId } = await params
  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  return <PersonalDetailsClient customerId={customerId} />
}

import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/server/get-server-session'
import ProfileClient from './profile-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { customerId } = await params

  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <ProfileClient
      customerId={customerId}
      firstName={session.user.firstName ?? ''}
      lastName={session.user.lastName ?? ''}
      email={session.user.email ?? ''}
    />
  )
}

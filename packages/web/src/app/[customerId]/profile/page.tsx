import { redirect } from 'next/navigation'
import { getSession } from '@/app/api/api-service'
import ProfileClient from './profile-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { customerId } = await params

  const session = await getSession()

  // Validate session
  if (!session || session.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <ProfileClient
      customerId={customerId}
      firstName={session.firstName}
      lastName={session.lastName}
      email={session.email}
    />
  )
}

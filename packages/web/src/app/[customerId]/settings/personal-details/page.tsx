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

  return (
    <PersonalDetailsClient
      customerId={customerId}
      firstName={session.user.firstName || ''}
      lastName={session.user.lastName || ''}
      email={session.user.email || ''}
      bvn={session.user.customerDetailsFromMono?.bvn || ''}
      dob={session.user.customerDetailsFromMono?.dob || ''}
      phone={session.user.customerDetailsFromMono?.phone || ''}
      gender={session.user.customerDetailsFromMono?.gender || ''}
      addressLine1={session.user.customerDetailsFromMono?.address_line1 || ''}
      addressLine2={session.user.customerDetailsFromMono?.address_line2 || ''}
      maritalStatus={session.user.customerDetailsFromMono?.marital_status || ''}
    />
  )
}

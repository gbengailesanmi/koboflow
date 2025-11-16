import { redirect } from 'next/navigation'
import { getSession, getBudget } from '@/lib/api-service'
import ProfileClient from './profile-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function ProfilePage({ params }: PageProps) {
  const { customerId } = await params

  // Fetch data in parallel on the server
  const [session, budgetRes] = await Promise.all([
    getSession(),
    getBudget(),
  ])

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
      currency={session.currency}
      totalBudgetLimit={budgetRes?.totalBudgetLimit || 0}
    />
  )
}

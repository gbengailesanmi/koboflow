import { redirect } from 'next/navigation'
import AnalyticsClient from './analytics-client'
import { getServerSession } from '@/lib/api/get-server-session'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function AnalyticsPage({ params }: PageProps) {
  const { customerId } = await params

  const session = await getServerSession()

  if (!session || session.user.customerId !== customerId) {
    redirect('/login')
  }

  return (
    <AnalyticsClient
      customerId={customerId}
      currency="NGN"
    />
  )
}

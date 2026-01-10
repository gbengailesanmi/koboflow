import DashboardClient from './dashboard-client'
import DashboardThemeWrapper from '../../components/dashboard/dashboard-theme'

interface DashboardPageProps {
  params: Promise<{ customerId: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { customerId } = await params

  return (
    <DashboardThemeWrapper>
      <DashboardClient customerId={customerId} />
    </DashboardThemeWrapper>
  )
}

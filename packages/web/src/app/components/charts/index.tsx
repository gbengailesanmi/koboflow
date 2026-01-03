
import dynamic from 'next/dynamic'
import { ChartSkeleton } from './chart-skeleton'

export const PieChart = dynamic(
  () => import('./pie-chart/pie-chart').then(mod => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
)

export const TreemapChart = dynamic(
  () => import('./treemap-chart/treemap-chart').then(mod => mod.TreemapChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
)

export const BubbleChart = dynamic(
  () => import('./bubble-chart/bubble-chart').then(mod => mod.BubbleChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
)

export const BalanceHistoryChart = dynamic(
  () => import('./balance-history-chart/balance-history-chart').then(mod => mod.BalanceHistoryChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
)

export const MonthOnMonthChart = dynamic(
  () => import('./month-on-month-chart/month-on-month-chart').then(mod => mod.MonthOnMonthChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: true,
  }
)

export { ChartPlaceholder } from './chart-placeholder'

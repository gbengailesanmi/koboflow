import { redirect } from 'next/navigation'
import { getSession, getSettings } from '@/app/api/api-service'
import SettingsClient from './settings-client'

type PageProps = {
  params: Promise<{
    customerId: string
  }>
}

export default async function SettingsPage({ params }: PageProps) {

}

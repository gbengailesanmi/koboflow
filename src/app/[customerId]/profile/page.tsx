'use server'

import { connectDB } from '@/db/mongo'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import ProfilePageClient from '@/app/components/profile-page-client/profile-page-client'

export default async function ProfilePage() {
  const user = await getSession()

  if (!user?.customerId) {
    redirect(`/login`)
  }

  const db = await connectDB()

  const userData = await db.collection('users').findOne({ customerId: user.customerId })

  if (!userData) {
    redirect(`/login`)
  }

  // Remove sensitive data before passing to client
  const sanitizedUser = {
    customerId: userData.customerId,
    name: userData.name,
    email: userData.email,
  }

  return <ProfilePageClient user={sanitizedUser} />
}
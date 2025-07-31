import { redirect } from 'next/navigation'
import LoginForm from '@/app/forms/login-form'
import { redirectIfAuth } from '@/lib/redirect-if-auth'

export default async function Page() {
  const customerId = await redirectIfAuth()
  if (customerId) {
    redirect(`/${customerId}/dashboard`)
  }

  return (
    <main className="p-4">
      <h1>Login</h1>
      <LoginForm />
    </main>
  )
}

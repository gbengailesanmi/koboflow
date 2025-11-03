import { redirect } from 'next/navigation'
import SignupForm from '@/app/forms/signup-form'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function Page() {
  const session = await auth()
  
  if (session?.user?.customerId) {
    redirect(`/${session.user.customerId}/dashboard`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Sign up to start managing your finances</p>
        <SignupForm />
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </main>
  )
}

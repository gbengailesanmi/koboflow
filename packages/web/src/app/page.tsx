import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export default async function LandingPage() {
  const session = await getServerSession(authOptions)

  console.log('[LANDING PAGE][DEBUG] session:', session)

  if (session?.user?.customerId) {
    redirect(`/${session.user.customerId}/dashboard`)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Money Mapper
          </h1>

          <p className="text-gray-600 mb-8">
            Track your finances, manage your budget, and achieve your financial goals
          </p>

          <div className="space-y-4">
            <Link
              href="/login"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Log In
            </Link>

            <Link
              href="/signup"
              className="block w-full bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg border-2 border-indigo-600 transition-colors duration-200"
            >
              Sign Up
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-500">
            Secure, simple, and powerful financial management
          </p>
        </div>
      </div>
    </main>
  )
}

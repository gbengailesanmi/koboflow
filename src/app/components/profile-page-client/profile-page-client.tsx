'use client'

import { useState } from 'react'
import { Pencil1Icon, CheckIcon, Cross2Icon, PersonIcon, EnvelopeClosedIcon, ArrowLeftIcon } from '@radix-ui/react-icons'
import Footer from '@/app/components/footer/footer'
import { redirect, useParams } from 'next/navigation'

type User = {
  customerId: string
  name: string
  email: string
}

type ProfilePageClientProps = {
  user: User
}

export default function ProfilePageClient({ user }: ProfilePageClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const params = useParams()
  const customerId = params.customerId as string

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim()
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to update profile')
        return
      }

      setSuccess('Profile updated successfully!')
      setIsEditing(false)
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000)

    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email
    })
    setIsEditing(false)
    setError('')
    setSuccess('')
  }

  return (
    <div className='min-h-screen bg-gray-300'>
      <div>
        <div>
          
          {/* Header */}
            <div className="flex items-center mb-2 relative">
            <div className="absolute left-0">
              <ArrowLeftIcon
              className="w-7 h-7 cursor-pointer"
              onClick={() => redirect(`/${customerId}/dashboard`)}
              style={{ color: '#222222' }}
              />
            </div>
            <div className="flex-1 flex justify-center">
              <h1 className="text-3xl font-bold text-gray-900 text-center">Profile Settings</h1>
            </div>
            </div>
            <div className="text-center mb-4">
            <p className="text-gray-500">Your account information</p>
            </div>

          {/* Profile Card */}
          <div className='bg-white rounded-xl shadow-lg'>
            
            {/* Customer ID Section */}
            <div className='mb-6 p-4 bg-gray-50 rounded-lg'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                Customer ID
              </label>
              <div className='text-sm text-gray-500 font-mono'>
                {user.customerId}
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-lg'>
                <p className='text-red-700 text-sm'>{error}</p>
              </div>
            )}

            {success && (
              <div className='mb-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
                <p className='text-green-700 text-sm'>{success}</p>
              </div>
            )}

            {/* Name Field */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <PersonIcon className='inline w-4 h-4 mr-1' />
                Full Name
              </label>
              {isEditing ? (
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  placeholder='Enter your full name'
                />
              ) : (
                <div className='px-4 py-3 bg-gray-50 rounded-lg border'>
                  <span className='text-gray-900'>{user.name}</span>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className='mb-8'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                <EnvelopeClosedIcon className='inline w-4 h-4 mr-1' />
                Email Address
              </label>
              {isEditing ? (
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                  placeholder='Enter your email address'
                />
              ) : (
                <div className='px-4 py-3 bg-gray-50 rounded-lg border'>
                  <span className='text-gray-900'>{user.email}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4'>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <CheckIcon className='w-4 h-4' />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className='flex items-center gap-2 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    <Cross2Icon className='w-4 h-4' />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className='flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200'
                >
                  <Pencil1Icon className='w-4 h-4' />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <Footer buttonColor='#222222'/>
    </div>
  )
}

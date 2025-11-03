import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/db/mongo'
import { signIn } from '@/auth'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Verification token is required' },
      { status: 400 }
    )
  }

  try {
    const db = await connectDB()
    
    // Find user with this verification token
    const user = await db.collection('users').findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() } // Token not expired
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, message: 'Email already verified' },
        { status: 400 }
      )
    }

    // Update user to verified and clear verification token
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          emailVerified: true,
          verifiedAt: new Date(),
        },
        $unset: {
          verificationToken: '',
          verificationTokenExpiry: '',
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. Please log in.',
      customerId: user.customerId,
    })
  } catch (error) {
    console.error('Error verifying email:', error)
    return NextResponse.json(
      { success: false, message: 'An error occurred during verification' },
      { status: 500 }
    )
  }
}

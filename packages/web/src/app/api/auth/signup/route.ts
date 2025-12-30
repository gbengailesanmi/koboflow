import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongo/mongo'
import bcrypt from 'bcrypt'
import { randomUUID } from 'crypto'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName } = body

    // 1️⃣ Basic validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'All fields are required' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const db = (await clientPromise).db()

    // 2️⃣ Check existing user
    const existing = await db
      .collection('users')
      .findOne({ email: normalizedEmail })

    if (existing) {
      return NextResponse.json(
        { message: 'Email already registered' },
        { status: 400 }
      )
    }

    // 3️⃣ Create user
    await db.collection('users').insertOne({
      email: normalizedEmail,
      password: await bcrypt.hash(password, 10),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      customerId: randomUUID(),
      emailVerified: false,
      authProvider: 'credentials',
      createdAt: new Date(),
    })

    return NextResponse.json(
      { success: true },
      { status: 201 }
    )
  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json(
      { message: 'Signup failed' },
      { status: 500 }
    )
  }
}

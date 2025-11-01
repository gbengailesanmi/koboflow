import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import {
  getCustomCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory
} from '@/db/helpers/custom-category-helpers'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await getCustomCategories(session.customerId)
    
    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching custom categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom categories' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, keywords, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return NextResponse.json({ error: 'At least one keyword is required' }, { status: 400 })
    }

    const category = await createCustomCategory(session.customerId, {
      name: name.trim(),
      keywords: keywords.filter(k => k.trim()).map(k => k.trim().toLowerCase()),
      color: color || '#6b7280'
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating custom category:', error)
    return NextResponse.json(
      { error: 'Failed to create custom category' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, keywords, color } = body

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const updateData: any = {}
    if (name?.trim()) updateData.name = name.trim()
    if (Array.isArray(keywords)) {
      updateData.keywords = keywords.filter(k => k.trim()).map(k => k.trim().toLowerCase())
    }
    if (color) updateData.color = color

    const success = await updateCustomCategory(session.customerId, id, updateData)

    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating custom category:', error)
    return NextResponse.json(
      { error: 'Failed to update custom category' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    const success = await deleteCustomCategory(session.customerId, id)

    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom category:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom category' },
      { status: 500 }
    )
  }
}

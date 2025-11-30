import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/middleware'
import {
  getCategories,
  getCustomCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory
} from '../db/helpers/spending-categories-helpers'

export const categoryRoutes = Router()

// Get all categories (default + custom)
// Get all categories (default + custom)
categoryRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get all categories (includes defaults + custom)
    const categories = await getCategories(customerId)
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

// Get only custom categories (backwards compatible)
categoryRoutes.get('/custom', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const customCategories = await getCustomCategories(customerId)
    
    res.json(customCategories)
  } catch (error) {
    console.error('Error fetching custom categories:', error)
    res.status(500).json({ error: 'Failed to fetch custom categories' })
  }
})

// Create new category
categoryRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, keywords, color } = req.body
    
    console.log('[Categories POST] Received request:', { customerId, name, keywords, color })

    if (!name?.trim()) {
      console.log('[Categories POST] ❌ Validation failed: Category name is required')
      return res.status(400).json({ error: 'Category name is required' })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      console.log('[Categories POST] ❌ Validation failed: At least one keyword is required')
      return res.status(400).json({ error: 'At least one keyword is required' })
    }

    const category = await addCategory(customerId, {
      name: name.trim(),
      keywords: keywords.filter((k: string) => k.trim()).map((k: string) => k.trim().toLowerCase()),
      color: color || '#6b7280'
    })

    console.log('[Categories POST] ✅ Category created successfully:', category.id)
    res.json(category)
  } catch (error) {
    console.error('[Categories POST] ❌ Error creating category:', error)
    res.status(500).json({ error: 'Failed to create category' })
  }
})

// Update category
categoryRoutes.patch('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params
    const { name, keywords, color } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' })
    }

    const updateData: any = {}
    if (name?.trim()) updateData.name = name.trim()
    if (Array.isArray(keywords)) {
      updateData.keywords = keywords.filter((k: string) => k.trim()).map((k: string) => k.trim().toLowerCase())
    }
    if (color) updateData.color = color

    const success = await updateCategory(customerId, id, updateData)

    if (!success) {
      return res.status(404).json({ error: 'Category not found or not editable' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error updating category:', error)
    if (error.message === 'Cannot edit default categories') {
      return res.status(403).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update category' })
  }
})

// Delete category
categoryRoutes.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { id } = req.params

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' })
    }

    const success = await deleteCategory(customerId, id)

    if (!success) {
      return res.status(404).json({ error: 'Category not found or not deletable' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting category:', error)
    if (error.message === 'Cannot delete default categories') {
      return res.status(403).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

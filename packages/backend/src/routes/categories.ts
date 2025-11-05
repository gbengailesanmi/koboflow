import { Router } from 'express'
import { authMiddleware, AuthRequest } from '../middleware/auth'
import {
  getCustomCategories,
  createCustomCategory,
  updateCustomCategory,
  deleteCustomCategory
} from '../db/helpers/custom-category-helpers'

export const categoryRoutes = Router()

/**
 * GET /api/categories
 * Get all custom categories for the user
 */
categoryRoutes.get('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const categories = await getCustomCategories(customerId)
    
    res.json(categories)
  } catch (error) {
    console.error('Error fetching custom categories:', error)
    res.status(500).json({ error: 'Failed to fetch custom categories' })
  }
})

/**
 * POST /api/categories
 * Create a new custom category
 */
categoryRoutes.post('/', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, keywords, color } = req.body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Category name is required' })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'At least one keyword is required' })
    }

    const category = await createCustomCategory(customerId, {
      name: name.trim(),
      keywords: keywords.filter((k: string) => k.trim()).map((k: string) => k.trim().toLowerCase()),
      color: color || '#6b7280'
    })

    res.json(category)
  } catch (error) {
    console.error('Error creating custom category:', error)
    res.status(500).json({ error: 'Failed to create custom category' })
  }
})

/**
 * PATCH /api/categories/:id
 * Update a custom category
 */
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

    const success = await updateCustomCategory(customerId, id, updateData)

    if (!success) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error updating custom category:', error)
    res.status(500).json({ error: 'Failed to update custom category' })
  }
})

/**
 * DELETE /api/categories/:id
 * Delete a custom category
 */
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

    const success = await deleteCustomCategory(customerId, id)

    if (!success) {
      return res.status(404).json({ error: 'Category not found' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom category:', error)
    res.status(500).json({ error: 'Failed to delete custom category' })
  }
})

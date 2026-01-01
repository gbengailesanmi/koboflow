import { Router } from 'express'
import { requireAuth } from '../middleware/middleware'
import { logger } from '@money-mapper/shared'
import {
  getCategories,
  getCustomCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory
} from '../db/helpers/spending-categories-helpers'

export const categoryRoutes = Router()

categoryRoutes.get('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const categories = await getCategories(customerId)
    
    res.json(categories)
  } catch (error) {
    logger.error({ module: 'categories-routes', error }, 'Failed to fetch categories')
    res.status(500).json({ error: 'Failed to fetch categories' })
  }
})

categoryRoutes.get('/custom', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const customCategories = await getCustomCategories(customerId)
    
    res.json(customCategories)
  } catch (error) {
    logger.error({ module: 'categories-routes', error }, 'Failed to fetch custom categories')
    res.status(500).json({ error: 'Failed to fetch custom categories' })
  }
})

categoryRoutes.post('/', requireAuth, async (req, res) => {
  try {
    const customerId = req.user?.customerId
    
    if (!customerId) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { name, keywords, color } = req.body
    
    logger.info({ module: 'categories-routes', customerId, name, keywordsCount: keywords?.length }, 'Category creation request')

    if (!name?.trim()) {
      logger.warn({ module: 'categories-routes', customerId }, 'Category name is required')
      return res.status(400).json({ error: 'Category name is required' })
    }

    if (!Array.isArray(keywords) || keywords.length === 0) {
      logger.warn({ module: 'categories-routes', customerId }, 'At least one keyword is required')
      return res.status(400).json({ error: 'At least one keyword is required' })
    }

    const category = await addCategory(customerId, {
      name: name.trim(),
      keywords: keywords.filter((k: string) => k.trim()).map((k: string) => k.trim().toLowerCase()),
      color: color || '#6b7280'
    })

    logger.info({ module: 'categories-routes', categoryId: category.id }, 'Category created successfully')
    res.json(category)
  } catch (error) {
    logger.error({ module: 'categories-routes', error }, 'Failed to create category')
    res.status(500).json({ error: 'Failed to create category' })
  }
})

categoryRoutes.patch('/:id', requireAuth, async (req, res) => {
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
    logger.error({ module: 'categories-routes', categoryId: req.params.id, error }, 'Failed to update category')
    if (error.message === 'Cannot edit default categories') {
      return res.status(403).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to update category' })
  }
})

categoryRoutes.delete('/:id', requireAuth, async (req, res) => {
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
    logger.error({ module: 'categories-routes', categoryId: req.params.id, error }, 'Failed to delete category')
    if (error.message === 'Cannot delete default categories') {
      return res.status(403).json({ error: error.message })
    }
    res.status(500).json({ error: 'Failed to delete category' })
  }
})

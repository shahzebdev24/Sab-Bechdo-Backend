import { Request, Response, NextFunction } from 'express';
import * as categoriesService from './categories.service.js';
import {
  getCategoriesListQuerySchema,
  createCategorySchema,
  updateCategorySchema,
  categoryIdParamSchema,
} from './categories.validation.js';
import { ValidationError } from '@core/errors/app-error.js';

/**
 * Get categories list (admin with filters)
 * GET /api/v1/admin/categories
 */
export const getCategoriesList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = getCategoriesListQuerySchema.parse(req.query);
    const result = await categoriesService.getCategoriesList(query);

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all active categories (public - for mobile app)
 * GET /api/v1/categories
 */
export const getActiveCategories = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoriesService.getActiveCategories();

    res.status(200).json({
      success: true,
      message: 'Active categories retrieved successfully',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get category by ID
 * GET /api/v1/admin/categories/:id
 */
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = categoryIdParamSchema.parse(req.params);
    const category = await categoriesService.getCategoryById(params.id);

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create new category
 * POST /api/v1/admin/categories
 */
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await categoriesService.createCategory(data);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update category
 * PATCH /api/v1/admin/categories/:id
 */
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = categoryIdParamSchema.parse(req.params);
    const data = updateCategorySchema.parse(req.body);

    if (Object.keys(data).length === 0) {
      throw new ValidationError('At least one field is required for update');
    }

    const category = await categoriesService.updateCategory(params.id, data);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle category status
 * PATCH /api/v1/admin/categories/:id/toggle-status
 */
export const toggleCategoryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = categoryIdParamSchema.parse(req.params);
    const category = await categoriesService.toggleCategoryStatus(params.id);

    res.status(200).json({
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { category },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/v1/admin/categories/:id
 */
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const params = categoryIdParamSchema.parse(req.params);
    const result = await categoriesService.deleteCategory(params.id);

    res.status(200).json({
      success: true,
      message: result.message,
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

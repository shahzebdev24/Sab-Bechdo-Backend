import * as categoriesRepository from './categories.repository.js';
import { ConflictError, NotFoundError, BadRequestError } from '@core/errors/app-error.js';

export interface GetCategoriesListParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
  icon?: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
  icon?: string;
}

/**
 * Transform MongoDB document to API response format
 * Converts _id to id and removes __v
 */
const transformCategory = (doc: any) => {
  if (!doc) return null;
  
  const { _id, __v, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  };
};

/**
 * Get categories list with filters (admin)
 */
export const getCategoriesList = async (params: GetCategoriesListParams) => {
  const {
    search,
    status,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10,
  } = params;

  // Convert status to isActive filter
  let isActive: boolean | undefined;
  if (status === 'active') {
    isActive = true;
  } else if (status === 'inactive') {
    isActive = false;
  }

  const result = await categoriesRepository.getCategoriesList({
    search,
    isActive,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  // Get total counts for stats
  const totalActive = await categoriesRepository.countCategories({ isActive: true });
  const totalInactive = await categoriesRepository.countCategories({ isActive: false });

  return {
    categories: result.categories.map(transformCategory),
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
      stats: {
        totalActive,
        totalInactive,
      },
    },
  };
};

/**
 * Get all active categories (for mobile app)
 */
export const getActiveCategories = async () => {
  const categories = await categoriesRepository.getActiveCategories();
  return categories.map(transformCategory);
};

/**
 * Get category by ID
 */
export const getCategoryById = async (categoryId: string) => {
  const category = await categoriesRepository.getCategoryById(categoryId);

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // If it's a Mongoose document, use toJSON, otherwise transform manually
  return category.toJSON ? category.toJSON() : transformCategory(category);
};

/**
 * Create new category
 */
export const createCategory = async (data: CreateCategoryData) => {
  // Check if name already exists
  const nameExists = await categoriesRepository.checkCategoryNameExists(data.name);
  if (nameExists) {
    throw new ConflictError('Category name already exists');
  }

  // Create category
  const category = await categoriesRepository.createCategory(data);

  return category.toJSON ? category.toJSON() : transformCategory(category);
};

/**
 * Update category
 */
export const updateCategory = async (categoryId: string, data: UpdateCategoryData) => {
  // Check if category exists
  const existingCategory = await categoriesRepository.getCategoryById(categoryId);
  if (!existingCategory) {
    throw new NotFoundError('Category not found');
  }

  // If name is being updated, check uniqueness
  if (data.name && data.name !== existingCategory.name) {
    const nameExists = await categoriesRepository.checkCategoryNameExists(data.name, categoryId);
    if (nameExists) {
      throw new ConflictError('Category name already exists');
    }
  }

  // Update category
  const updatedCategory = await categoriesRepository.updateCategory(categoryId, data);

  if (!updatedCategory) {
    throw new NotFoundError('Category not found');
  }

  return updatedCategory.toJSON ? updatedCategory.toJSON() : transformCategory(updatedCategory);
};

/**
 * Toggle category status
 */
export const toggleCategoryStatus = async (categoryId: string) => {
  const category = await categoriesRepository.toggleCategoryStatus(categoryId);

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  return category.toJSON ? category.toJSON() : transformCategory(category);
};

/**
 * Delete category
 */
export const deleteCategory = async (categoryId: string) => {
  // Check if category exists
  const category = await categoriesRepository.getCategoryById(categoryId);
  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check if category has items
  if (category.itemCount > 0) {
    throw new BadRequestError(
      `Cannot delete category with ${category.itemCount} items. Please reassign or delete items first.`
    );
  }

  // Delete category
  await categoriesRepository.deleteCategory(categoryId);

  return { message: 'Category deleted successfully' };
};

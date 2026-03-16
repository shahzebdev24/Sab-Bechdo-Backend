import { Category, CategoryDocument } from '@models/category.model.js';
import { FilterQuery } from 'mongoose';

export interface GetCategoriesFilters {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page: number;
  limit: number;
}

/**
 * Get categories list with filters and pagination
 */
export const getCategoriesList = async (filters: GetCategoriesFilters) => {
  const {
    search,
    isActive,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page,
    limit,
  } = filters;

  // Build query
  const query: FilterQuery<CategoryDocument> = {};

  // Search filter
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  // Active filter
  if (isActive !== undefined) {
    query.isActive = isActive;
  }

  // Sorting
  const sort: Record<string, 1 | -1> = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Pagination
  const skip = (page - 1) * limit;

  // Execute query
  const [categories, total] = await Promise.all([
    Category.find(query).sort(sort).skip(skip).limit(limit).lean(),
    Category.countDocuments(query),
  ]);

  return {
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * Get all active categories (for mobile app)
 */
export const getActiveCategories = async () => {
  const categories = await Category.find({ isActive: true })
    .lean();
  
  // Sort: "Other" category at the end, rest alphabetically
  return categories.sort((a, b) => {
    if (a.name.toLowerCase() === 'other') return 1;
    if (b.name.toLowerCase() === 'other') return -1;
    return a.name.localeCompare(b.name);
  });
};

/**
 * Get category by ID
 */
export const getCategoryById = async (categoryId: string): Promise<CategoryDocument | null> => {
  return await Category.findById(categoryId);
};

/**
 * Get category by slug
 */
export const getCategoryByName = async (name: string): Promise<CategoryDocument | null> => {
  return await Category.findOne({ name });
};

/**
 * Create new category
 */
export const createCategory = async (data: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<CategoryDocument> => {
  const category = await Category.create(data);
  return category;
};

/**
 * Update category
 */
export const updateCategory = async (
  categoryId: string,
  data: {
    name?: string;
    description?: string;
    icon?: string;
  }
): Promise<CategoryDocument | null> => {
  return await Category.findByIdAndUpdate(categoryId, data, {
    new: true,
    runValidators: true,
  });
};

/**
 * Toggle category status
 */
export const toggleCategoryStatus = async (
  categoryId: string
): Promise<CategoryDocument | null> => {
  const category = await Category.findById(categoryId);
  if (!category) return null;

  category.isActive = !category.isActive;
  await category.save();
  return category;
};

/**
 * Delete category
 */
export const deleteCategory = async (categoryId: string): Promise<CategoryDocument | null> => {
  return await Category.findByIdAndDelete(categoryId);
};

/**
 * Check if category name exists
 */
export const checkCategoryNameExists = async (
  name: string,
  excludeCategoryId?: string
): Promise<boolean> => {
  const query: FilterQuery<CategoryDocument> = { name };
  if (excludeCategoryId) {
    query._id = { $ne: excludeCategoryId };
  }
  const count = await Category.countDocuments(query);
  return count > 0;
};

/**
 * Check if category slug exists
 */
export const checkCategoryNameExistsByName = async (
  name: string,
  excludeCategoryId?: string
): Promise<boolean> => {
  const query: FilterQuery<CategoryDocument> = { 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  };
  if (excludeCategoryId) {
    query._id = { $ne: excludeCategoryId };
  }
  const count = await Category.countDocuments(query);
  return count > 0;
};

/**
 * Update category item count
 */
export const updateCategoryItemCount = async (categoryName: string, increment: number) => {
  return await Category.findOneAndUpdate(
    { name: categoryName },
    { $inc: { itemCount: increment } },
    { new: true }
  );
};

/**
 * Count categories by filter
 */
export const countCategories = async (filter: { isActive?: boolean }): Promise<number> => {
  const query: FilterQuery<CategoryDocument> = {};
  
  if (filter.isActive !== undefined) {
    query.isActive = filter.isActive;
  }
  
  return await Category.countDocuments(query);
};

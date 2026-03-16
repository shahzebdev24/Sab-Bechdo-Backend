import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory {
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  itemCount: number;
}

export interface CategoryDocument extends ICategory, Document {
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<CategoryDocument>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    itemCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret.id = (ret._id as mongoose.Types.ObjectId).toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for filtering active categories
categorySchema.index({ isActive: 1, createdAt: -1 });

export const Category = mongoose.model<CategoryDocument>('Category', categorySchema);

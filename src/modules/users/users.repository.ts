import { User, UserDocument } from '@models/user.model.js';
import { UpdateProfileDto, UpdatePreferencesDto } from './users.validation.js';

export const findById = async (id: string): Promise<UserDocument | null> => {
  return await User.findById(id);
};

export const updateProfile = async (
  id: string,
  data: UpdateProfileDto
): Promise<UserDocument | null> => {
  return await User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
};

export const updatePreferences = async (
  id: string,
  preferences: UpdatePreferencesDto
): Promise<UserDocument | null> => {
  const updateFields: Record<string, unknown> = {};

  // Build $set object for nested fields
  if (preferences.notifications) {
    Object.entries(preferences.notifications).forEach(([key, value]) => {
      updateFields[`preferences.notifications.${key}`] = value;
    });
  }

  if (preferences.theme !== undefined) {
    updateFields['preferences.theme'] = preferences.theme;
  }

  if (preferences.language !== undefined) {
    updateFields['preferences.language'] = preferences.language;
  }

  return await User.findByIdAndUpdate(id, { $set: updateFields }, { new: true, runValidators: true });
};

export const findByIdPublic = async (id: string): Promise<UserDocument | null> => {
  return await User.findById(id).select('name email avatarUrl username createdAt');
};

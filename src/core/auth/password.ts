import bcrypt from 'bcrypt';
import { AUTH_CONSTANTS } from '@common/constants.js';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, AUTH_CONSTANTS.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

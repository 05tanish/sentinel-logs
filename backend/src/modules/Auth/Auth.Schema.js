import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one numeric digit')
    .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, 'Password must contain at least one special character'),
});

export const resetPasswordSchema = z.object({
  userId: z.number().int().positive('Valid user ID is required'),
  newPassword: z.string()
    .min(12, 'Password must be at least 12 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one numeric digit')
    .regex(/[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/, 'Password must contain at least one special character'),
});

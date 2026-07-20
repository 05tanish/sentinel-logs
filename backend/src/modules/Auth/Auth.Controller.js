import { AppError } from '../../utilis/ApiResponse.js';
import { asyncHandler } from '../../middelware/ErrorMiddelware.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { loginSchema, changePasswordSchema, resetPasswordSchema } from './Auth.Schema.js';
import { loginUser, changePassword, resetUserPassword } from './Auth.Service.js';

export const login = asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Validation failed', parsed.error.errors);

  const data = await loginUser(parsed.data, req.ip);
  return successResponse(res, { statusCode: 200, message: 'Login successful', data });
});

export const changeUserPassword = asyncHandler(async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Validation failed', parsed.error.errors);

  const data = await changePassword(req.user.id, parsed.data, req.ip);
  return successResponse(res, { statusCode: 200, message: 'Password changed successfully', data });
});

export const adminResetPassword = asyncHandler(async (req, res) => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Validation failed', parsed.error.errors);

  const data = await resetUserPassword(req.user.id, parsed.data, req.ip);
  return successResponse(res, { statusCode: 200, message: 'Password reset successfully', data });
});

import { AppError } from '../../utilis/ApiResponse.js';
import { AsyncHandeler } from '../../utilis/Aysnchandler.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { loginSchema } from './Auth.Schema.js';
import { loginUser } from './Auth.Service.js';

export const login = AsyncHandeler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Validation failed', parsed.error.errors);

  const data = await loginUser(parsed.data);
  return successResponse(res, { statusCode: 200, message: 'Login successful', data });
});

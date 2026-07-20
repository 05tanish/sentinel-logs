import { AppError } from '../../utilis/ApiResponse.js';
import { asyncHandler } from '../../middelware/ErrorMiddelware.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import { createUserSchema } from './Users.Schema.js';
import { createUser, getAllUsers, deactivateUser, activateUser } from './Users.Service.js';

// POST /api/users — admin creates a new user
export const addUser = asyncHandler(async (req, res) => {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) throw new AppError(400, 'Validation failed', parsed.error.errors);

  const data = await createUser(parsed.data);
  return successResponse(res, {
    statusCode: 201,
    message: 'User created successfully',
    data,
  });
});

// GET /api/users — admin lists all users
export const listUsers = asyncHandler(async (_req, res) => {
  const data = await getAllUsers();
  return successResponse(res, { message: 'Users fetched', data });
});

// PATCH /api/users/:id/deactivate — admin disables a user
export const deactivate = asyncHandler(async (req, res) => {
  const data = await deactivateUser(req.params.id);
  return successResponse(res, { message: 'User deactivated', data });
});

// PATCH /api/users/:id/activate — admin re-enables a user
export const activate = asyncHandler(async (req, res) => {
  const data = await activateUser(req.params.id);
  return successResponse(res, { message: 'User activated', data });
});

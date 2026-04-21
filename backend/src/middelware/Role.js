import { AppError } from '../utilis/ApiResponse.js';

export const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) throw new AppError(401, 'Not authenticated');
    if (!roles.includes(req.user.role)) {
      throw new AppError(403, `Role '${req.user.role}' is not allowed to access this route`);
    }
    next();
  };
};

import { AppError } from '../../utilis/ApiResponse.js';
import { asyncHandler } from '../../middelware/ErrorMiddelware.js';
import { successResponse } from '../../utilis/Sucessresponse.js';
import {
  getAllAlerts,
  getAlertById,
  acknowledgeAlert,
  resolveAlert,
  getAlertStats,
} from './Alerts.Service.js';

export const getAlerts = asyncHandler(async (req, res) => {
  const { severity, type, resolved, limit, offset } = req.query;
  const data = await getAllAlerts({ severity, type, resolved, limit, offset });
  return successResponse(res, { message: 'Alerts fetched', data });
});

export const getAlert = asyncHandler(async (req, res) => {
  const data = await getAlertById(req.params.id);
  if (!data) throw new AppError(404, 'Alert not found');
  return successResponse(res, { message: 'Alert fetched', data });
});

export const acknowledge = asyncHandler(async (req, res) => {
  const data = await acknowledgeAlert(req.params.id);
  if (!data) throw new AppError(404, 'Alert not found');
  return successResponse(res, { message: 'Alert acknowledged', data });
});

export const resolve = asyncHandler(async (req, res) => {
  const data = await resolveAlert(req.params.id);
  if (!data) throw new AppError(404, 'Alert not found');
  return successResponse(res, { message: 'Alert resolved', data });
});

export const stats = asyncHandler(async (_req, res) => {
  const data = await getAlertStats();
  return successResponse(res, { message: 'Alert stats', data });
});

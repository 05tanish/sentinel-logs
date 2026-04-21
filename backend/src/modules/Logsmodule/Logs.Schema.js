import { z } from 'zod';

export const logSchema = z.object({
  raw: z.string().min(1, 'Log message is required'),
  source: z.string().default('unknown'),
  timestamp: z.string().optional(),
});

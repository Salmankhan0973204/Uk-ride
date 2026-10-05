import { apiFetch } from '@/lib/api/client';
import type { HealthData } from '../types';

/** Raw HTTP functions only. No React hooks in this file. */
export const healthApi = {
  getHealth: (signal?: AbortSignal) => apiFetch<HealthData>('/health', { signal }),
};

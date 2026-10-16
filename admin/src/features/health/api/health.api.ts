import { ApiError, apiFetch } from '@/lib/api/client';
import type { HealthData, ReadinessData } from '../types';

function hasChecks(details: unknown): details is Pick<ReadinessData, 'checks'> {
  return typeof details === 'object' && details !== null && 'checks' in details;
}

/** Raw HTTP functions only. No React hooks in this file. */
export const healthApi = {
  getHealth: (signal?: AbortSignal) => apiFetch<HealthData>('/health', { signal }),

  /**
   * A 503 from readiness is an answer, not a failure: the API is running and
   * tells us which dependency is down. It is returned as data, so only a real
   * failure (the API cannot be reached) ends up as an error.
   */
  getReadiness: async (signal?: AbortSignal): Promise<ReadinessData> => {
    try {
      return await apiFetch<ReadinessData>('/health/ready', { signal });
    } catch (error) {
      if (
        error instanceof ApiError &&
        error.code === 'SERVICE_UNAVAILABLE' &&
        hasChecks(error.details)
      ) {
        return { status: 'not_ready', checks: error.details.checks };
      }
      throw error;
    }
  },
};

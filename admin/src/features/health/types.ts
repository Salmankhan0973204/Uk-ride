/** Response data of GET /api/v1/health. */
export interface HealthData {
  status: 'ok';
  service: string;
  version: string;
  env: 'development' | 'test' | 'production';
  uptimeSeconds: number;
  timestamp: string;
}

/** One dependency of the API, as reported by GET /api/v1/health/ready. */
export interface DependencyCheck {
  /** `skipped` means the API does not use this dependency yet. */
  status: 'up' | 'down' | 'skipped';
  note?: string;
}

/**
 * Result of GET /api/v1/health/ready.
 * `not_ready` comes from a 503 answer: the API runs but a dependency is down.
 */
export interface ReadinessData {
  status: 'ready' | 'not_ready';
  checks: Record<string, DependencyCheck>;
}

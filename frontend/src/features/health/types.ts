/** Response data of GET /api/v1/health. */
export interface HealthData {
  status: 'ok';
  service: string;
  version: string;
  env: 'development' | 'test' | 'production';
  uptimeSeconds: number;
  timestamp: string;
}

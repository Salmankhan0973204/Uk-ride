/** Mirrors the success envelope returned by the Express API. */
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/** Mirrors the error envelope returned by the Express API. */
export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

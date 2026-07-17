export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function readApiErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const data = payload as Record<string, unknown>;
  const nestedError = data.error && typeof data.error === 'object' ? data.error as Record<string, unknown> : undefined;
  const candidates = [data.code, data.errorCode, nestedError?.code, nestedError?.errorCode, typeof data.error === 'string' ? data.error : undefined];
  const code = candidates.find((value): value is string => typeof value === 'string' && value.trim().length > 0);
  return code?.trim().toLowerCase();
}

export function isRequestCancelledError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 409 && error.code === 'request_cancelled';
}

import { NextResponse } from 'next/server';
import type { z } from 'zod';

import type { ApiErrorBody, ApiErrorCode } from '@/types/shared';

const STATUS: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PAYMENT_FAILED: 402,
  AI_UNAVAILABLE: 503,
  INTERNAL_ERROR: 500,
};

/**
 * An error the client should see. Services and guards throw it; `withApi`
 * turns it into the standard `{ error: { code, message } }` body. The message
 * is shown to people, so write it in plain words.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status ?? STATUS[code];
  }
}

export function errorResponse(code: ApiErrorCode, message: string, status = STATUS[code]): NextResponse<ApiErrorBody> {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wraps a route handler so every failure leaves in the standard error shape. */
export function withApi<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>,
): (...args: Args) => Promise<Response> {
  return async (...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ApiError) return errorResponse(err.code, err.message, err.status);
      console.error('Unhandled API error', err);
      return errorResponse('INTERNAL_ERROR', 'Something went wrong on our side. Try again.');
    }
  };
}

/**
 * Parse and validate a JSON request body. Requiring the JSON content type also
 * stops other sites from posting plain HTML forms at these endpoints.
 */
export async function parseJsonBody<Schema extends z.ZodType>(request: Request, schema: Schema): Promise<z.infer<Schema>> {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
    throw new ApiError('VALIDATION_ERROR', 'Send the request as JSON.');
  }
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'The request body is not valid JSON.');
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ApiError('VALIDATION_ERROR', result.error.issues[0]?.message ?? 'Check the form and try again.');
  }
  return result.data;
}

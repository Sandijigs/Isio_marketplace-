import type { ApiErrorBody, AuthResponse } from '@/types/shared';

export type AuthResult = { ok: true; data: AuthResponse } | { ok: false; message: string };

function isApiError(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'error' in body;
}

/** POST to an auth endpoint and turn any failure into a sentence a person can act on. */
export async function submitAuth(path: '/api/auth/signin' | '/api/auth/signup', body: unknown): Promise<AuthResult> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json: unknown = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: json as AuthResponse };
    return { ok: false, message: isApiError(json) ? json.error.message : 'Something went wrong on our side. Try again.' };
  } catch {
    return { ok: false, message: 'Couldn’t reach Isio. Check your connection and try again.' };
  }
}

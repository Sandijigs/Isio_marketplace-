import { NextResponse } from 'next/server';

import { ApiError, parseJsonBody, withApi } from '@/lib/api';
import { authenticate } from '@/services/catalog/accounts';
import { signInInput } from '@/services/catalog/auth-input';
import { ensureDemoData } from '@/services/catalog/demo-seed';
import { startSession } from '@/services/catalog/session';
import type { AuthResponse } from '@/types/shared';

/** POST /api/auth/signin — start a session. */
export const POST = withApi(async (request: Request) => {
  const input = await parseJsonBody(request, signInInput);
  // Demo accounts must exist even if nobody has opened the sign-in page since a reset.
  await ensureDemoData();
  const user = await authenticate(input);
  if (!user) throw new ApiError('UNAUTHORIZED', 'That email and password don’t match an account. Check both and try again.');
  const response = NextResponse.json<AuthResponse>({ user });
  await startSession(response, user.id);
  return response;
});

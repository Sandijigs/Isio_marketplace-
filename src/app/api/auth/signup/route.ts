import { NextResponse } from 'next/server';

import { parseJsonBody, withApi } from '@/lib/api';
import { signUp } from '@/services/catalog/accounts';
import { signUpInput } from '@/services/catalog/auth-input';
import { startSession } from '@/services/catalog/session';
import type { AuthResponse } from '@/types/shared';

/** POST /api/auth/signup — create a buyer or creative account and sign in. */
export const POST = withApi(async (request: Request) => {
  const input = await parseJsonBody(request, signUpInput);
  const user = await signUp(input);
  const response = NextResponse.json<AuthResponse>({ user }, { status: 201 });
  await startSession(response, user.id);
  return response;
});

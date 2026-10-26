import { NextResponse } from 'next/server';

import { withApi } from '@/lib/api';
import { endSession } from '@/services/catalog/session';

/**
 * POST /api/auth/signout — end the session. Always succeeds: signing out
 * with an expired cookie should still clear it. A plain HTML form post (the
 * header's sign-out button, no JavaScript needed) is sent back to the home page.
 */
export const POST = withApi(async (request: Request) => {
  const fromForm = request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded') ?? false;
  const response = fromForm
    ? NextResponse.redirect(new URL('/', request.url), 303)
    : NextResponse.json({ ok: true });
  endSession(response);
  return response;
});

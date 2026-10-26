import { NextResponse } from 'next/server';

import { withApi } from '@/lib/api';
import { getCreativeProfile } from '@/services/catalog/accounts';
import { requireUser } from '@/services/catalog/session';
import type { MeResponse } from '@/types/shared';

/** GET /api/auth/me — the signed-in user and, for creatives, their profile. */
export const GET = withApi(async () => {
  const user = await requireUser();
  const creativeProfile = user.role === 'CREATIVE' ? await getCreativeProfile(user.id) : null;
  return NextResponse.json<MeResponse>({ user, creativeProfile });
});

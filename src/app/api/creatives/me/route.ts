import { NextResponse } from 'next/server';

import { parseJsonBody, withApi } from '@/lib/api';
import { upsertMyProfile } from '@/services/catalog/creatives';
import { profileInput } from '@/services/catalog/profile-input';
import { requireCreative } from '@/services/catalog/session';
import type { MyProfileResponse } from '@/types/shared';

/**
 * PUT /api/creatives/me — create or update the signed-in creative's own profile.
 * The profile is always the session's; the body never names whose it is.
 */
export const PUT = withApi(async (request: Request) => {
  const user = await requireCreative();
  const input = await parseJsonBody(request, profileInput);
  const creativeProfile = await upsertMyProfile(user.id, input);
  return NextResponse.json<MyProfileResponse>({ creativeProfile });
});

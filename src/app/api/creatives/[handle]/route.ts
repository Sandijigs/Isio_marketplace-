import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiError, withApi } from '@/lib/api';
import { getCreativeByHandle } from '@/services/catalog/creatives';
import { ensureDemoAccounts } from '@/services/catalog/demo-accounts';
import type { StorefrontResponse } from '@/types/shared';

// Loose on purpose: anything that isn't a valid handle simply isn't found.
const params = z.object({ handle: z.string().min(1).max(64) });

/** GET /api/creatives/[handle] — public storefront data. Never includes the PayPal email. */
export const GET = withApi(async (_request: Request, context: { params: Promise<{ handle: string }> }) => {
  const parsed = params.safeParse(await context.params);
  await ensureDemoAccounts();
  const creative = parsed.success ? await getCreativeByHandle(parsed.data.handle) : null;
  if (!creative) throw new ApiError('NOT_FOUND', 'No maker has that handle.');
  return NextResponse.json<StorefrontResponse>({ creative });
});

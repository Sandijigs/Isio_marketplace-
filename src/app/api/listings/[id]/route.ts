import { NextResponse } from 'next/server';
import { z } from 'zod';

import { ApiError, parseJsonBody, withApi } from '@/lib/api';
import { listingPatch } from '@/services/catalog/listing-input';
import { getListing, updateListing } from '@/services/catalog/listings';
import { getSession, requireCreative } from '@/services/catalog/session';
import type { ListingResponse } from '@/types/shared';

type Context = { params: Promise<{ id: string }> };

// Loose on purpose: anything that isn't a real id simply isn't found.
const params = z.object({ id: z.string().min(1).max(100) });

async function listingId(context: Context): Promise<string> {
  const parsed = params.safeParse(await context.params);
  if (!parsed.success) throw new ApiError('NOT_FOUND', 'No listing has that id.');
  return parsed.data.id;
}

/** GET /api/listings/[id] — ACTIVE listings are public; drafts, sold-out and archived ones only to their owner. */
export const GET = withApi(async (_request: Request, context: Context) => {
  const id = await listingId(context);
  const viewer = await getSession();
  const listing = await getListing(id, viewer?.id ?? null);
  if (!listing) throw new ApiError('NOT_FOUND', 'No listing has that id.');
  return NextResponse.json<ListingResponse>({ listing });
});

/** PATCH /api/listings/[id] — the owner edits fields and/or moves the status (publish, sold out, archive). */
export const PATCH = withApi(async (request: Request, context: Context) => {
  const user = await requireCreative();
  const id = await listingId(context);
  const patch = await parseJsonBody(request, listingPatch);
  const listing = await updateListing(user.id, id, patch);
  return NextResponse.json<ListingResponse>({ listing });
});

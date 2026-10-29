import { NextResponse } from 'next/server';

import { parseJsonBody, withApi } from '@/lib/api';
import { listingInput } from '@/services/catalog/listing-input';
import { createListing } from '@/services/catalog/listings';
import { requireCreative } from '@/services/catalog/session';
import type { ListingResponse } from '@/types/shared';

/** POST /api/listings — create a DRAFT owned by the signed-in creative. Publishing is a PATCH. */
export const POST = withApi(async (request: Request) => {
  const user = await requireCreative();
  const input = await parseJsonBody(request, listingInput);
  const listing = await createListing(user.id, input);
  return NextResponse.json<ListingResponse>({ listing }, { status: 201 });
});

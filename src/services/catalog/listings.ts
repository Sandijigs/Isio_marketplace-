import { and, desc, eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { ApiError } from '@/lib/api';
import { money } from '@/lib/money';
import type { CurrencyCode, Listing, ListingStatus } from '@/types/shared';

import { getCreativeProfile } from './creatives';
import { canMoveTo, isPublished, type ListingInput, type ListingPatch, listGaps, publishGaps } from './listing-input';

type ListingRow = typeof schema.listings.$inferSelect;
interface Maker {
  handle: string;
  displayName: string;
}

function toListing(row: ListingRow, maker: Maker): Listing {
  const currency = row.currency as CurrencyCode;
  return {
    id: row.id,
    creativeId: row.creativeId,
    creativeHandle: maker.handle,
    creativeName: maker.displayName,
    kind: row.kind,
    status: row.status,
    title: row.title,
    description: row.description,
    story: row.story,
    category: row.category,
    price: money(row.priceCents, currency),
    shipping: money(row.shippingCents, currency),
    stock: row.stock,
    turnaroundDays: row.turnaroundDays,
    images: row.images,
    tags: row.tags,
    aiDrafted: row.aiDrafted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** A product has stock and no turnaround; a service the other way round. Keeps stale form values out. */
function normaliseKindFields<T extends Pick<ListingInput, 'kind' | 'stock' | 'turnaroundDays'>>(values: T): T {
  return values.kind === 'PRODUCT' ? { ...values, turnaroundDays: null } : { ...values, stock: null };
}

const listingWithMaker = () =>
  getDb()
    .select({
      listing: schema.listings,
      handle: schema.creativeProfiles.handle,
      displayName: schema.creativeProfiles.displayName,
    })
    .from(schema.listings)
    .innerJoin(schema.creativeProfiles, eq(schema.creativeProfiles.userId, schema.listings.creativeId));

/**
 * A new listing is always a DRAFT, owned by `userId` from the session. The
 * creative needs a stall first: listings show under its handle.
 */
export async function createListing(userId: string, input: ListingInput): Promise<Listing> {
  const profile = await getCreativeProfile(userId);
  if (!profile) throw new ApiError('FORBIDDEN', 'Set up your stall before you list a piece.');

  const values = normaliseKindFields(input);
  const [row] = await getDb()
    .insert(schema.listings)
    .values({ ...values, creativeId: userId, status: 'DRAFT' })
    .returning();
  if (!row) throw new Error('Listing insert returned no row');
  return toListing(row, profile);
}

/**
 * One listing as `viewerId` may see it: ACTIVE listings are public, every
 * other status only to its owner. Anyone else gets null, as if it didn't exist.
 */
export async function getListing(id: string, viewerId: string | null): Promise<Listing | null> {
  const [row] = await listingWithMaker().where(eq(schema.listings.id, id)).limit(1);
  if (!row) return null;
  if (row.listing.status !== 'ACTIVE' && row.listing.creativeId !== viewerId) return null;
  return toListing(row.listing, row);
}

/** Every listing the creative owns, in any status, most recently changed first. */
export async function listMyListings(userId: string): Promise<Listing[]> {
  const rows = await listingWithMaker()
    .where(eq(schema.listings.creativeId, userId))
    .orderBy(desc(schema.listings.updatedAt), desc(schema.listings.createdAt));
  return rows.map((r) => toListing(r.listing, r));
}

/** What buyers see on a storefront: ACTIVE listings only, newest first. */
export async function listStorefrontListings(handle: string): Promise<Listing[]> {
  const rows = await listingWithMaker()
    .where(and(eq(schema.creativeProfiles.handle, handle.trim().toLowerCase()), eq(schema.listings.status, 'ACTIVE')))
    .orderBy(desc(schema.listings.createdAt));
  return rows.map((r) => toListing(r.listing, r));
}

/**
 * Edit fields and/or change status. Only the owner may. Moving to ACTIVE (or
 * editing a listing that is ACTIVE or SOLD_OUT) requires the full publish
 * rules, so a live listing can never lose its photo or price.
 *
 * The write is `UPDATE ... WHERE status = <the status we checked>`: if someone
 * changed it in between, nothing is written and the creative is told to reload.
 */
export async function updateListing(userId: string, id: string, patch: ListingPatch): Promise<Listing> {
  const [current] = await getDb().select().from(schema.listings).where(eq(schema.listings.id, id)).limit(1);
  if (!current) throw new ApiError('NOT_FOUND', 'No listing has that id.');
  if (current.creativeId !== userId) throw new ApiError('FORBIDDEN', 'You can only change your own listings.');
  if (current.status === 'ARCHIVED') throw new ApiError('CONFLICT', 'This listing is archived, so it can’t be changed.');

  const { status: requested, ...fields } = patch;
  const target: ListingStatus = requested ?? current.status;
  if (target !== current.status && !canMoveTo(current.status, target)) {
    throw new ApiError('CONFLICT', statusMoveMessage(current.status, target));
  }

  const merged = normaliseKindFields({
    kind: fields.kind ?? current.kind,
    title: fields.title ?? current.title,
    description: fields.description ?? current.description,
    story: fields.story !== undefined ? fields.story : current.story,
    category: fields.category !== undefined ? fields.category : current.category,
    priceCents: fields.priceCents ?? current.priceCents,
    shippingCents: fields.shippingCents ?? current.shippingCents,
    stock: fields.stock !== undefined ? fields.stock : current.stock,
    turnaroundDays: fields.turnaroundDays !== undefined ? fields.turnaroundDays : current.turnaroundDays,
    images: fields.images ?? current.images,
  });

  const profile = await getCreativeProfile(userId);
  if (!profile) throw new ApiError('FORBIDDEN', 'Set up your stall before you change listings.');

  // Archiving never needs a complete listing: the creative must always be able to take a piece down.
  if (isPublished(target)) {
    const gaps = publishGaps(merged, Boolean(profile.paypalEmail));
    if (gaps.length > 0) {
      const verb = target === 'ACTIVE' && current.status === 'DRAFT' ? 'publish' : 'keep this listing live';
      throw new ApiError('VALIDATION_ERROR', `To ${verb}, add ${listGaps(gaps)}.`);
    }
  }

  const [row] = await getDb()
    .update(schema.listings)
    .set({ ...merged, status: target, updatedAt: new Date() })
    .where(
      and(eq(schema.listings.id, id), eq(schema.listings.creativeId, userId), eq(schema.listings.status, current.status)),
    )
    .returning();
  if (!row) throw new ApiError('CONFLICT', 'This listing changed while you were editing. Reload the page and try again.');
  return toListing(row, profile);
}

function statusMoveMessage(from: ListingStatus, to: ListingStatus): string {
  if (to === 'DRAFT') return 'A published listing can’t go back to being a draft. Archive it instead.';
  if (from === 'DRAFT' && to === 'SOLD_OUT') return 'Publish this listing before marking it sold out.';
  return 'That status change isn’t possible for this listing.';
}

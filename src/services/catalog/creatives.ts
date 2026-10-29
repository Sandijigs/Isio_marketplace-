import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { ApiError } from '@/lib/api';
import type { CreativeProfile, PublicCreativeProfile } from '@/types/shared';

import { isDemoEmail } from './demo-accounts';
import type { ProfileInput } from './profile-input';

type CreativeProfileRow = typeof schema.creativeProfiles.$inferSelect;

export function toCreativeProfile(row: CreativeProfileRow): CreativeProfile {
  return {
    userId: row.userId,
    handle: row.handle,
    displayName: row.displayName,
    craft: row.craft,
    story: row.story,
    location: row.location,
    country: row.country,
    avatarUrl: row.avatarUrl,
    paypalEmail: row.paypalEmail,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Picks the public fields one by one rather than deleting private ones, so a
 * column added later stays private until someone decides otherwise.
 */
function toPublicProfile(row: CreativeProfileRow, ownerEmail: string): PublicCreativeProfile {
  return {
    handle: row.handle,
    displayName: row.displayName,
    craft: row.craft,
    story: row.story,
    location: row.location,
    country: row.country,
    avatarUrl: row.avatarUrl,
    isDemo: isDemoEmail(ownerEmail),
    createdAt: row.createdAt.toISOString(),
  };
}

/** The owner's full profile, including the PayPal email. */
export async function getCreativeProfile(userId: string): Promise<CreativeProfile | null> {
  const [row] = await getDb()
    .select()
    .from(schema.creativeProfiles)
    .where(eq(schema.creativeProfiles.userId, userId))
    .limit(1);
  return row ? toCreativeProfile(row) : null;
}

/** Public storefront data for a handle, or null. Handles match case-insensitively. */
export async function getCreativeByHandle(handle: string): Promise<PublicCreativeProfile | null> {
  const [row] = await getDb()
    .select({ profile: schema.creativeProfiles, email: schema.users.email })
    .from(schema.creativeProfiles)
    .innerJoin(schema.users, eq(schema.users.id, schema.creativeProfiles.userId))
    .where(eq(schema.creativeProfiles.handle, handle.trim().toLowerCase()))
    .limit(1);
  return row ? toPublicProfile(row.profile, row.email) : null;
}

/**
 * Create or update the profile of `userId`, which must come from the session,
 * never from the request. The row is keyed by user id, so a creative can only
 * ever write their own profile. A handle owned by someone else fails on the
 * unique index (no read-then-write race) and comes back as CONFLICT.
 */
export async function upsertMyProfile(userId: string, input: ProfileInput): Promise<CreativeProfile> {
  const values = {
    handle: input.handle,
    displayName: input.displayName,
    craft: input.craft,
    location: input.location,
    story: input.story,
    paypalEmail: input.paypalEmail,
  };
  try {
    const [row] = await getDb()
      .insert(schema.creativeProfiles)
      .values({ userId, ...values })
      .onConflictDoUpdate({ target: schema.creativeProfiles.userId, set: values })
      .returning();
    if (!row) throw new Error('Profile upsert returned no row');
    return toCreativeProfile(row);
  } catch (err) {
    if (isUniqueViolation(err)) throw new ApiError('CONFLICT', `@${input.handle} is taken. Try another handle.`);
    throw err;
  }
}

/** Postgres unique_violation (23505), whether Drizzle wraps the driver error or not. */
function isUniqueViolation(err: unknown): boolean {
  for (let e: unknown = err; e && typeof e === 'object'; e = (e as { cause?: unknown }).cause) {
    if ((e as { code?: unknown }).code === '23505') return true;
  }
  return false;
}

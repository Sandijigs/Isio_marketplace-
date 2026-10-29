import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { eq, sql } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import type { Database } from '@/db/client';
import { schema } from '@/db/client';
import { localImageStore } from '@/services/catalog/images';
import { seedDemoData } from '@/services/catalog/demo-seed';

import { createTestDb } from './helpers/test-db';

async function counts(db: Database) {
  const count = async (table: typeof schema.users | typeof schema.creativeProfiles | typeof schema.listings) =>
    (await db.select({ n: sql<number>`count(*)::int` }).from(table))[0]?.n;
  const active = (await db.select({ n: sql<number>`count(*)::int` }).from(schema.listings).where(eq(schema.listings.status, 'ACTIVE')))[0]?.n;
  return {
    users: await count(schema.users),
    profiles: await count(schema.creativeProfiles),
    listings: await count(schema.listings),
    active,
  };
}

describe('seedDemoData', () => {
  it('creates five makers and a dozen live listings, and is safe to run again', async () => {
    const db = await createTestDb();
    const store = localImageStore(await mkdtemp(path.join(os.tmpdir(), 'isio-seed-')));

    await seedDemoData({ db, store });
    const first = await counts(db);
    expect(first).toEqual({ users: 6, profiles: 5, listings: 13, active: 12 });

    // Someone edits a demo listing; the next boot must not undo it.
    await db.update(schema.listings).set({ title: 'Edited by a judge' }).where(eq(schema.listings.id, 'demo-ese-drop-earrings'));

    await seedDemoData({ db, store });
    expect(await counts(db)).toEqual(first);
    const [earrings] = await db.select().from(schema.listings).where(eq(schema.listings.id, 'demo-ese-drop-earrings'));
    expect(earrings?.title).toBe('Edited by a judge');
  }, 60_000);

  it('gives every live listing a stored photo, a price and a maker with a PayPal email', async () => {
    const db = await createTestDb();
    const store = localImageStore(await mkdtemp(path.join(os.tmpdir(), 'isio-seed-')));
    await seedDemoData({ db, store });

    const rows = await db
      .select({ listing: schema.listings, paypalEmail: schema.creativeProfiles.paypalEmail })
      .from(schema.listings)
      .innerJoin(schema.creativeProfiles, eq(schema.creativeProfiles.userId, schema.listings.creativeId))
      .where(eq(schema.listings.status, 'ACTIVE'));

    const kinds = new Set(rows.map((r) => r.listing.kind));
    expect(kinds).toEqual(new Set(['PRODUCT', 'SERVICE']));
    for (const { listing, paypalEmail } of rows) {
      expect(listing.priceCents).toBeGreaterThan(0);
      expect(paypalEmail).toBeTruthy();
      expect(listing.images.length).toBeGreaterThan(0);
      for (const image of listing.images) {
        expect(await store.find(image.url.replace('/uploads/', ''))).toBe(image.url);
      }
    }
  }, 60_000);

  it('never gives the stall-only makers a password', async () => {
    const db = await createTestDb();
    await seedDemoData({ db, store: localImageStore(await mkdtemp(path.join(os.tmpdir(), 'isio-seed-'))) });
    const [ejiro] = await db.select().from(schema.users).where(eq(schema.users.email, 'ejiro@example.com'));
    expect(ejiro?.passwordHash).toBeNull();
  }, 60_000);
});

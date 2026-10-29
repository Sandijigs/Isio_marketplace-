import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { and, eq, inArray, isNull } from 'drizzle-orm';

import { type Database, getDb, schema } from '@/db/client';
import type { ListingCategory, ListingKind } from '@/types/shared';

import { DEMO_ACCOUNTS, DEMO_PASSWORD, demoAccountsEnabled } from './demo-accounts';
import { getImageStore, type ImageStore, processImage } from './images';
import { hashPassword } from './password';

/**
 * The demo catalog: five fictional makers and their stalls. Used by
 * `pnpm db:seed` and run on boot in demo mode, so a fresh disk (Render's free
 * tier wipes it) always has something to browse.
 *
 * Idempotent by construction: users match on email, profiles on user id,
 * listings on fixed ids, photos on fixed names. Re-running fills in whatever
 * is missing and never overwrites anything a person has since edited.
 *
 * Copy stays plain and describes only what the photos show: these makers are
 * fictional, so nothing here may read as a fact about a real tradition.
 * Photo sources are recorded in scripts/seed-images.md.
 */

export const DEMO_PHOTOS_DIR = path.join(process.cwd(), 'src/assets/demo');

interface DemoMaker {
  email: string;
  name: string;
  /** Shown on the sign-in page; makers without one have a stall but no sign-in. */
  canSignIn: boolean;
  handle: string;
  craft: string;
  location: string;
  story: string;
}

const MAKERS: readonly DemoMaker[] = [
  {
    email: 'ese@example.com',
    name: 'Ese',
    canSignIn: true,
    handle: 'ese',
    craft: 'Beadwork',
    location: 'Warri, Delta State',
    story:
      'I make beaded necklaces, bracelets and bags in my workshop in Warri. Tell me the colours you love and I will make something just for you.',
  },
  {
    email: 'kemi@example.com',
    name: 'Kemi',
    canSignIn: true,
    handle: 'kemi',
    craft: 'Adire textiles',
    location: 'Abeokuta, Ogun State',
    story:
      'I dye and sew wrappers, scarves and table runners. Every piece is dyed by hand, so no two come out quite the same.',
  },
  {
    email: 'ejiro@example.com',
    name: 'Ejiro',
    canSignIn: false,
    handle: 'ejiro',
    craft: 'Woodwork',
    location: 'Sapele, Delta State',
    story: 'I carve and paint masks and figures from my yard in Sapele. Big or small, each one is finished by hand.',
  },
  {
    email: 'amaka@example.com',
    name: 'Amaka',
    canSignIn: false,
    handle: 'amaka',
    craft: 'Clay and calabash',
    location: 'Enugu, Enugu State',
    story: 'I throw pots on the wheel and engrave calabashes. Send me the size you need and I will make it for your home.',
  },
  {
    email: 'tari@example.com',
    name: 'Tari',
    canSignIn: false,
    handle: 'tari',
    craft: 'Basket weaving',
    location: 'Yenagoa, Bayelsa State',
    story: 'I weave baskets and bags in bright colours. Tell me where it will live and I will pick colours to match.',
  },
];

interface DemoListing {
  id: string;
  maker: string; // handle
  kind: ListingKind;
  status: 'ACTIVE' | 'DRAFT';
  title: string;
  description: string;
  story: string | null;
  category: ListingCategory;
  priceCents: number;
  shippingCents: number;
  stock: number | null;
  turnaroundDays: number | null;
  photos: ReadonlyArray<{ file: string; alt: string }>;
  tags: string[];
}

const LISTINGS: readonly DemoListing[] = [
  {
    id: 'demo-ese-beaded-embroidery',
    maker: 'ese',
    kind: 'SERVICE',
    status: 'ACTIVE',
    title: 'Hand-beaded embroidery, to your design',
    description:
      'Pearl and silver beads sewn by hand onto the fabric of your choice. Send me a sketch or describe the pattern, the colours and the size, and I will quote you before I start.',
    story: 'This photo is from a panel I finished last month. Yours will be made just for you.',
    category: 'beadwork',
    priceCents: 6000,
    shippingCents: 1500,
    stock: null,
    turnaroundDays: 14,
    photos: [{ file: 'beadwork.jpg', alt: 'A hand sewing pearl and silver beads onto mint green fabric' }],
    tags: ['embroidery', 'beads', 'custom'],
  },
  {
    id: 'demo-ese-drop-earrings',
    maker: 'ese',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Beaded drop earrings',
    description: 'Light beaded earrings that hang just below the ear. Ready to ship, packed in a small cloth pouch.',
    story: null,
    category: 'jewelry',
    priceCents: 2800,
    shippingCents: 1200,
    stock: 6,
    turnaroundDays: null,
    photos: [{ file: 'earrings.jpg', alt: 'A hand reaching for beaded earrings on a display stand' }],
    tags: ['earrings', 'beads'],
  },
  {
    id: 'demo-kemi-indigo-wrapper',
    maker: 'kemi',
    kind: 'PRODUCT',
    status: 'DRAFT',
    title: 'Indigo wrapper',
    description: 'A full-length wrapper, dyed by hand in deep blue.',
    story: null,
    category: 'textiles',
    priceCents: 4000,
    shippingCents: 1500,
    stock: 2,
    turnaroundDays: null,
    // A draft without a photo on purpose: signed in as Kemi, a judge sees exactly what publishing still needs.
    photos: [],
    tags: ['wrapper', 'indigo'],
  },
  {
    id: 'demo-ejiro-mask-set',
    maker: 'ejiro',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Carved wooden masks, set of three',
    description: 'Three carved and painted wooden masks, ready to hang. Sold together as a set.',
    story: null,
    category: 'woodwork',
    priceCents: 18000,
    shippingCents: 3500,
    stock: 1,
    turnaroundDays: null,
    photos: [{ file: 'masks.jpg', alt: 'Three carved and painted wooden masks laid side by side' }],
    tags: ['masks', 'wall art'],
  },
  {
    id: 'demo-ejiro-lantern-figure',
    maker: 'ejiro',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Wire and jute lantern figure',
    description: 'A standing figure of bent wire wrapped in jute, holding a black metal lantern. Each one is made after you order.',
    story: null,
    category: 'sculpture',
    priceCents: 9500,
    shippingCents: 2500,
    stock: null,
    turnaroundDays: null,
    photos: [{ file: 'lantern.jpg', alt: 'A wire figure wrapped in jute, carrying a black metal lantern' }],
    tags: ['figure', 'lantern'],
  },
  {
    id: 'demo-ejiro-mask-commission',
    maker: 'ejiro',
    kind: 'SERVICE',
    status: 'ACTIVE',
    title: 'A carved mask, made to your design',
    description: 'Tell me the size, the colours and the feeling you want, and I will carve and paint one mask for you.',
    story: null,
    category: 'woodwork',
    priceCents: 12000,
    shippingCents: 3500,
    stock: null,
    turnaroundDays: 21,
    photos: [{ file: 'masks.jpg', alt: 'Carved and painted wooden masks, examples of past work' }],
    tags: ['mask', 'custom'],
  },
  {
    id: 'demo-amaka-clay-pot',
    maker: 'amaka',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Hand-thrown clay pot',
    description: 'A round clay pot thrown on the wheel, about the size of two hands. Good for plants or as a piece on its own.',
    story: null,
    category: 'pottery',
    priceCents: 6500,
    shippingCents: 3000,
    stock: 3,
    turnaroundDays: null,
    photos: [{ file: 'pottery.jpg', alt: 'Hands shaping a clay pot on a potter’s wheel' }],
    tags: ['pot', 'clay'],
  },
  {
    id: 'demo-amaka-calabash-pair',
    maker: 'amaka',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Engraved calabash gourds, pair',
    description: 'Two calabash gourds with patterns burnt into the skin. Sold as a pair.',
    story: null,
    category: 'other',
    priceCents: 4800,
    shippingCents: 2000,
    stock: 4,
    turnaroundDays: null,
    photos: [{ file: 'calabash.jpg', alt: 'Calabash gourds with burnt black patterns' }],
    tags: ['calabash', 'gourd'],
  },
  {
    id: 'demo-amaka-pot-commission',
    maker: 'amaka',
    kind: 'SERVICE',
    status: 'ACTIVE',
    title: 'A clay pot thrown to your size',
    description: 'Give me the height and width you need and I will throw a pot to fit. I send a photo before it ships.',
    story: null,
    category: 'pottery',
    priceCents: 8000,
    shippingCents: 3000,
    stock: null,
    turnaroundDays: 21,
    photos: [{ file: 'pottery.jpg', alt: 'A clay pot taking shape on a potter’s wheel' }],
    tags: ['pot', 'custom'],
  },
  {
    id: 'demo-tari-woven-basket',
    maker: 'tari',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Woven basket in orange, blue and white',
    description: 'A sturdy round basket woven in orange, blue and white. Ready to ship.',
    story: null,
    category: 'other',
    priceCents: 4200,
    shippingCents: 2000,
    stock: 2,
    turnaroundDays: null,
    photos: [{ file: 'weaving.jpg', alt: 'Hands weaving an orange, blue and white basket' }],
    tags: ['basket'],
  },
  {
    id: 'demo-tari-round-bag',
    maker: 'tari',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Round woven bag with a leather Africa map',
    description: 'A round woven shoulder bag with a map of Africa stitched on in leather.',
    story: null,
    category: 'fashion',
    priceCents: 5500,
    shippingCents: 1800,
    stock: 5,
    turnaroundDays: null,
    photos: [{ file: 'woven-bag.jpg', alt: 'Hands holding a round woven bag with a stitched leather map of Africa' }],
    tags: ['bag', 'woven'],
  },
  {
    id: 'demo-tari-wall-baskets',
    maker: 'tari',
    kind: 'PRODUCT',
    status: 'ACTIVE',
    title: 'Coiled wall baskets, set of five',
    description: 'Five flat coiled baskets in different colours and sizes, made to hang on a wall. Woven after you order.',
    story: null,
    category: 'other',
    priceCents: 12000,
    shippingCents: 4000,
    stock: null,
    turnaroundDays: null,
    photos: [{ file: 'wall-baskets.jpg', alt: 'Colourful coiled baskets hanging on an orange wall' }],
    tags: ['baskets', 'wall art'],
  },
  {
    id: 'demo-tari-basket-commission',
    maker: 'tari',
    kind: 'SERVICE',
    status: 'ACTIVE',
    title: 'A basket woven in your colours',
    description: 'Choose the size and up to three colours, and I will weave a basket for you.',
    story: null,
    category: 'other',
    priceCents: 4500,
    shippingCents: 2000,
    stock: null,
    turnaroundDays: 10,
    photos: [{ file: 'weaving.jpg', alt: 'A basket being woven by hand, an example of past work' }],
    tags: ['basket', 'custom'],
  },
];

/** Placeholder payees until F6 maps demo stalls to PayPal sandbox business accounts. */
const demoPaypalEmail = (handle: string) => `${handle}.demo@example.com`;

export interface SeedOptions {
  db?: Database;
  store?: ImageStore;
  photosDir?: string;
}

export async function seedDemoData({
  db = getDb(),
  store = getImageStore(),
  photosDir = DEMO_PHOTOS_DIR,
}: SeedOptions = {}): Promise<void> {
  const emails = MAKERS.map((m) => m.email).concat(DEMO_ACCOUNTS.map((a) => a.email));
  const existing = await db.select({ email: schema.users.email }).from(schema.users).where(inArray(schema.users.email, emails));
  const have = new Set(existing.map((r) => r.email));

  const missingAccounts = DEMO_ACCOUNTS.filter((a) => !have.has(a.email));
  const missingMakers = MAKERS.filter((m) => !m.canSignIn && !have.has(m.email));
  if (missingAccounts.length > 0 || missingMakers.length > 0) {
    const passwordHash = missingAccounts.length > 0 ? await hashPassword(DEMO_PASSWORD) : null;
    await db
      .insert(schema.users)
      .values([
        ...missingAccounts.map((a) => ({ email: a.email, name: a.name, role: a.role, passwordHash })),
        // No password: nobody can sign in as these makers.
        ...missingMakers.map((m) => ({ email: m.email, name: m.name, role: 'CREATIVE' as const, passwordHash: null })),
      ])
      .onConflictDoNothing({ target: schema.users.email });
  }

  const users = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users).where(inArray(schema.users.email, emails));
  const userIdByEmail = new Map(users.map((u) => [u.email, u.id]));
  const userIdByHandle = new Map<string, string>();

  for (const maker of MAKERS) {
    const userId = userIdByEmail.get(maker.email);
    if (!userId) continue;
    userIdByHandle.set(maker.handle, userId);
    // Do nothing if the maker already has a profile, or if a real creative already took the handle.
    await db
      .insert(schema.creativeProfiles)
      .values({
        userId,
        handle: maker.handle,
        displayName: maker.name,
        craft: maker.craft,
        location: maker.location,
        story: maker.story,
        paypalEmail: demoPaypalEmail(maker.handle),
      })
      .onConflictDoNothing();
    // Profiles seeded before listings existed had no payee; fill it in without touching one someone set.
    await db
      .update(schema.creativeProfiles)
      .set({ paypalEmail: demoPaypalEmail(maker.handle) })
      .where(and(eq(schema.creativeProfiles.userId, userId), isNull(schema.creativeProfiles.paypalEmail)));
  }

  const photoUrls = new Map<string, string>();
  for (const file of new Set(LISTINGS.flatMap((l) => l.photos.map((p) => p.file)))) {
    photoUrls.set(file, await storeDemoPhoto(file, store, photosDir));
  }

  const rows = LISTINGS.flatMap((l) => {
    const creativeId = userIdByHandle.get(l.maker);
    if (!creativeId) return [];
    const { maker: _maker, photos, ...fields } = l;
    const images = photos.map((p) => ({ url: photoUrls.get(p.file) ?? '', alt: p.alt }));
    return [{ ...fields, creativeId, images }];
  });
  if (rows.length > 0) await db.insert(schema.listings).values(rows).onConflictDoNothing({ target: schema.listings.id });
}

/** Resize and store a sample photo once; later runs reuse the stored copy. */
async function storeDemoPhoto(file: string, store: ImageStore, photosDir: string): Promise<string> {
  const name = `demo-${path.basename(file, path.extname(file))}.jpg`;
  const found = await store.find(name);
  if (found) return found;
  const image = await processImage(await readFile(path.join(photosDir, file)), 'image/jpeg');
  return store.put(name, image.bytes, image.contentType);
}

// The key carries a version so a dev server that ran an older seed (accounts and profiles only) re-runs it.
const globalForDemo = globalThis as unknown as { __isioDemoSeedV3?: Promise<void> };

/**
 * Seed the demo catalog if it isn't there yet. Safe to call on every request:
 * runs once per process (cached on globalThis to survive hot reloads) and
 * retries after a failure. Does nothing where Isio takes live payments.
 */
export function ensureDemoData(): Promise<void> {
  if (!demoAccountsEnabled()) return Promise.resolve();
  globalForDemo.__isioDemoSeedV3 ??= seedDemoData().catch((err: unknown) => {
    globalForDemo.__isioDemoSeedV3 = undefined;
    throw err;
  });
  return globalForDemo.__isioDemoSeedV3;
}

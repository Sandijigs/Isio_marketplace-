import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { ApiErrorBody, ListingResponse } from '@/types/shared';

import { createTestDb } from './helpers/test-db';

const state = vi.hoisted(() => ({ db: null as unknown, cookie: undefined as string | undefined }));

vi.mock('@/db/client', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getDb: () => state.db,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'isio_session' && state.cookie ? { name, value: state.cookie } : undefined),
  }),
}));

const { signUp } = await import('@/services/catalog/accounts');
const { upsertMyProfile } = await import('@/services/catalog/creatives');
const { createSessionToken } = await import('@/services/catalog/session');
const { POST: postListing } = await import('@/app/api/listings/route');
const { GET: getListingRoute, PATCH: patchListingRoute } = await import('@/app/api/listings/[id]/route');

beforeAll(async () => {
  state.db = await createTestDb();
}, 30_000);

beforeEach(() => {
  state.cookie = undefined;
});

let counter = 0;
async function newUser(role: 'BUYER' | 'CREATIVE', { paypal = true, profile = true } = {}) {
  counter += 1;
  const user = await signUp({ name: `Maker ${counter}`, email: `listing-user-${counter}@example.com`, password: 'market-day', role });
  if (role === 'CREATIVE' && profile) {
    await upsertMyProfile(user.id, {
      handle: `maker-${counter}`,
      displayName: `Maker ${counter}`,
      craft: 'Beadwork',
      location: null,
      story: null,
      paypalEmail: paypal ? `maker-${counter}@example.com` : null,
    });
  }
  return user;
}

async function signInAs(user: { id: string } | null) {
  state.cookie = user ? await createSessionToken(user.id) : undefined;
}

const json = (body: unknown) => ({ headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

function create(body: unknown) {
  return postListing(new Request('http://localhost/api/listings', { method: 'POST', ...json(body) }));
}
function patch(id: string, body: unknown) {
  return patchListingRoute(new Request(`http://localhost/api/listings/${id}`, { method: 'PATCH', ...json(body) }), {
    params: Promise.resolve({ id }),
  });
}
function fetchListing(id: string) {
  return getListingRoute(new Request(`http://localhost/api/listings/${id}`), { params: Promise.resolve({ id }) });
}

/** A listing that meets every publish rule. */
const complete = {
  kind: 'PRODUCT',
  title: 'Red coral bead necklace',
  description: 'Three strands of red beads, about 45 cm long.',
  story: 'My grandmother taught me this pattern.',
  category: 'jewelry',
  priceCents: 4500,
  shippingCents: 1200,
  stock: 3,
  turnaroundDays: null,
  images: [{ url: '/uploads/3f0c9a52-6e1b-4b7a-9d2c-1a2b3c4d5e6f.jpg', alt: 'Red necklace on white cloth' }],
};

async function createAs(user: { id: string }, body: unknown = complete): Promise<string> {
  await signInAs(user);
  const res = await create(body);
  expect(res.status).toBe(201);
  return ((await res.json()) as ListingResponse).listing.id;
}

async function errorOf(res: Response): Promise<ApiErrorBody['error']> {
  return ((await res.json()) as ApiErrorBody).error;
}

describe('POST /api/listings', () => {
  it('needs a signed-in creative with a stall', async () => {
    expect((await create(complete)).status).toBe(401);

    await signInAs(await newUser('BUYER'));
    expect((await create(complete)).status).toBe(403);

    await signInAs(await newUser('CREATIVE', { profile: false }));
    const res = await create(complete);
    expect(res.status).toBe(403);
    expect((await errorOf(res)).message).toMatch(/stall/);
  });

  it('always creates a DRAFT owned by the session, whatever the body says', async () => {
    const [owner, other] = [await newUser('CREATIVE'), await newUser('CREATIVE')];
    await signInAs(owner);
    const res = await create({ ...complete, status: 'ACTIVE', creativeId: other.id });
    const { listing } = (await res.json()) as ListingResponse;
    expect(listing).toMatchObject({ status: 'DRAFT', creativeId: owner.id, price: { cents: 4500, currency: 'USD' } });
  });

  it('saves an incomplete draft so nothing is lost', async () => {
    const id = await createAs(await newUser('CREATIVE'), {
      ...complete,
      title: '',
      description: '',
      category: null,
      priceCents: 0,
      images: [],
    });
    expect(id).toBeTruthy();
  });

  it('takes prices only as whole cents', async () => {
    await signInAs(await newUser('CREATIVE'));
    expect((await create({ ...complete, priceCents: 45.5 })).status).toBe(400);
    expect((await create({ ...complete, priceCents: -100 })).status).toBe(400);
  });

  it('only accepts photos Isio stored', async () => {
    await signInAs(await newUser('CREATIVE'));
    const res = await create({ ...complete, images: [{ url: 'https://evil.example/x.jpg', alt: '' }] });
    expect(res.status).toBe(400);
  });

  it('keeps stock off services and turnaround off products', async () => {
    await signInAs(await newUser('CREATIVE'));
    const res = await create({ ...complete, kind: 'SERVICE', stock: 5, turnaroundDays: 14 });
    expect(((await res.json()) as ListingResponse).listing).toMatchObject({ stock: null, turnaroundDays: 14 });
  });
});

describe('publishing', () => {
  it('publishes a complete draft', async () => {
    const owner = await newUser('CREATIVE');
    const id = await createAs(owner);
    const res = await patch(id, { status: 'ACTIVE' });
    expect(res.status).toBe(200);
    expect(((await res.json()) as ListingResponse).listing.status).toBe('ACTIVE');
  });

  it('lists exactly what is missing', async () => {
    const id = await createAs(await newUser('CREATIVE'), { ...complete, title: '  ', category: null, images: [] });
    const res = await patch(id, { status: 'ACTIVE' });
    expect(res.status).toBe(400);
    expect(await errorOf(res)).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'To publish, add at least one photo, a title and a category.',
    });
  });

  it('needs a price above zero', async () => {
    const id = await createAs(await newUser('CREATIVE'), { ...complete, priceCents: 0 });
    expect((await errorOf(await patch(id, { status: 'ACTIVE' }))).message).toBe('To publish, add a price above $0.');
  });

  it('needs the creative’s PayPal email, because buyers pay them directly', async () => {
    const id = await createAs(await newUser('CREATIVE', { paypal: false }));
    const error = await errorOf(await patch(id, { status: 'ACTIVE' }));
    expect(error.message).toBe('To publish, add your PayPal email, in your stall details.');
  });

  it('needs a turnaround for a service', async () => {
    const id = await createAs(await newUser('CREATIVE'), { ...complete, kind: 'SERVICE', stock: null, turnaroundDays: null });
    expect((await errorOf(await patch(id, { status: 'ACTIVE' }))).message).toBe(
      'To publish, add how many days it takes to make.',
    );
  });

  it('never lets a live listing lose what publishing required', async () => {
    const id = await createAs(await newUser('CREATIVE'));
    await patch(id, { status: 'ACTIVE' });
    const res = await patch(id, { images: [] });
    expect(res.status).toBe(400);
    expect((await errorOf(res)).message).toBe('To keep this listing live, add at least one photo.');
  });
});

describe('status flow', () => {
  it('goes DRAFT → ACTIVE ↔ SOLD_OUT → ARCHIVED, and archived is final', async () => {
    const id = await createAs(await newUser('CREATIVE'));
    for (const status of ['ACTIVE', 'SOLD_OUT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED']) {
      const res = await patch(id, { status });
      expect(res.status, `→ ${status}`).toBe(200);
    }
    expect((await patch(id, { status: 'ACTIVE' })).status).toBe(409);
    expect((await patch(id, { title: 'New title' })).status).toBe(409);
  });

  it('refuses moves outside the flow', async () => {
    const id = await createAs(await newUser('CREATIVE'));
    expect((await patch(id, { status: 'SOLD_OUT' })).status).toBe(409);
    await patch(id, { status: 'ACTIVE' });
    expect((await patch(id, { status: 'DRAFT' })).status).toBe(409);
  });

  it('archives an incomplete draft: taking a piece down never needs a complete listing', async () => {
    const id = await createAs(await newUser('CREATIVE'), { ...complete, title: '', images: [] });
    expect((await patch(id, { status: 'ARCHIVED' })).status).toBe(200);
  });
});

describe('owner-only edits', () => {
  it('lets nobody but the owner change a listing', async () => {
    const id = await createAs(await newUser('CREATIVE'));

    await signInAs(null);
    expect((await patch(id, { title: 'Hijacked' })).status).toBe(401);

    await signInAs(await newUser('BUYER'));
    expect((await patch(id, { title: 'Hijacked' })).status).toBe(403);

    await signInAs(await newUser('CREATIVE'));
    const res = await patch(id, { title: 'Hijacked', status: 'ARCHIVED' });
    expect(res.status).toBe(403);
    expect((await errorOf(res)).code).toBe('FORBIDDEN');
  });

  it('leaves the listing untouched after a refused edit', async () => {
    const owner = await newUser('CREATIVE');
    const id = await createAs(owner);
    await signInAs(await newUser('CREATIVE'));
    await patch(id, { title: 'Hijacked' });

    await signInAs(owner);
    const { listing } = (await (await fetchListing(id)).json()) as ListingResponse;
    expect(listing.title).toBe(complete.title);
  });

  it('says plainly when there is no such listing', async () => {
    await signInAs(await newUser('CREATIVE'));
    expect((await patch('no-such-listing', { title: 'x' })).status).toBe(404);
  });
});

describe('GET /api/listings/[id] visibility', () => {
  it('shows a draft only to its owner', async () => {
    const owner = await newUser('CREATIVE');
    const id = await createAs(owner);
    expect((await fetchListing(id)).status).toBe(200);

    await signInAs(null);
    expect((await fetchListing(id)).status).toBe(404);
    await signInAs(await newUser('CREATIVE'));
    expect((await fetchListing(id)).status).toBe(404);
  });

  it('shows an ACTIVE listing to everyone, and hides it again once sold out or archived', async () => {
    const owner = await newUser('CREATIVE');
    const id = await createAs(owner);
    await patch(id, { status: 'ACTIVE' });

    await signInAs(null);
    const res = await fetchListing(id);
    expect(res.status).toBe(200);
    expect(((await res.json()) as ListingResponse).listing).toMatchObject({ status: 'ACTIVE', creativeHandle: expect.any(String) });

    await signInAs(owner);
    await patch(id, { status: 'SOLD_OUT' });
    await signInAs(null);
    expect((await fetchListing(id)).status).toBe(404);

    await signInAs(owner);
    expect((await fetchListing(id)).status).toBe(200);
    await patch(id, { status: 'ARCHIVED' });
    await signInAs(null);
    expect((await fetchListing(id)).status).toBe(404);
  });

  it('never includes the creative’s PayPal email', async () => {
    const owner = await newUser('CREATIVE');
    const id = await createAs(owner);
    await patch(id, { status: 'ACTIVE' });
    await signInAs(null);
    const text = await (await fetchListing(id)).text();
    expect(text).not.toContain('paypal');
    expect(text).not.toContain('@example.com');
  });
});

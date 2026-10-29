import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/lib/api';
import type { ApiErrorBody, MyProfileResponse, StorefrontResponse } from '@/types/shared';

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
const { getCreativeByHandle, getCreativeProfile, upsertMyProfile } = await import('@/services/catalog/creatives');
const { createSessionToken } = await import('@/services/catalog/session');
const { PUT: putMyProfile } = await import('@/app/api/creatives/me/route');
const { GET: getStorefront } = await import('@/app/api/creatives/[handle]/route');

beforeAll(async () => {
  state.db = await createTestDb();
}, 30_000);

beforeEach(() => {
  state.cookie = undefined;
});

let counter = 0;
async function newUser(role: 'BUYER' | 'CREATIVE') {
  counter += 1;
  return signUp({ name: `Maker ${counter}`, email: `user-${counter}@example.com`, password: 'market-day', role });
}

async function signInAs(user: { id: string }) {
  state.cookie = await createSessionToken(user.id);
}

function putProfile(body: unknown) {
  return putMyProfile(
    new Request('http://localhost/api/creatives/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

function fetchStorefront(handle: string) {
  return getStorefront(new Request(`http://localhost/api/creatives/${handle}`), { params: Promise.resolve({ handle }) });
}

const profile = (handle: string) => ({
  handle,
  displayName: 'Ese',
  craft: 'Beadwork',
  location: 'Warri, Delta State',
  story: 'I make beaded necklaces.',
  paypalEmail: `${handle}-shop@example.com`,
});

describe('upsertMyProfile', () => {
  it('creates the profile, then updates the same row', async () => {
    const creative = await newUser('CREATIVE');
    await upsertMyProfile(creative.id, { ...profile('first-handle'), location: null, story: null, paypalEmail: null });
    const updated = await upsertMyProfile(creative.id, profile('second-handle'));
    expect(updated.handle).toBe('second-handle');
    expect(await getCreativeByHandle('first-handle')).toBeNull();
    expect((await getCreativeProfile(creative.id))?.handle).toBe('second-handle');
  });

  it('refuses a handle another creative already has', async () => {
    const [a, b] = [await newUser('CREATIVE'), await newUser('CREATIVE')];
    await upsertMyProfile(a.id, profile('taken-handle'));
    const err = await upsertMyProfile(b.id, profile('taken-handle')).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe('CONFLICT');
    expect((err as ApiError).status).toBe(409);
    expect(await getCreativeProfile(b.id)).toBeNull();
  });

  it('lets a creative save again with their own handle', async () => {
    const a = await newUser('CREATIVE');
    await upsertMyProfile(a.id, profile('keep-mine'));
    await expect(upsertMyProfile(a.id, { ...profile('keep-mine'), craft: 'Bags' })).resolves.toMatchObject({ craft: 'Bags' });
  });
});

describe('PUT /api/creatives/me', () => {
  it('rejects anonymous visitors with 401 and the standard error shape', async () => {
    const res = await putProfile(profile('anon-try'));
    expect(res.status).toBe(401);
    expect(((await res.json()) as ApiErrorBody).error.code).toBe('UNAUTHORIZED');
  });

  it('rejects buyers with 403', async () => {
    await signInAs(await newUser('BUYER'));
    const res = await putProfile(profile('buyer-try'));
    expect(res.status).toBe(403);
    expect(((await res.json()) as ApiErrorBody).error.code).toBe('FORBIDDEN');
  });

  it('saves the signed-in creative’s profile and returns it with their PayPal email', async () => {
    await signInAs(await newUser('CREATIVE'));
    const res = await putProfile({ ...profile('Route-Maker'), handle: 'Route-Maker' });
    expect(res.status).toBe(200);
    const body = (await res.json()) as MyProfileResponse;
    expect(body.creativeProfile).toMatchObject({ handle: 'route-maker', paypalEmail: 'route-maker-shop@example.com' });
  });

  it('answers a taken handle with 409, whatever its case', async () => {
    const owner = await newUser('CREATIVE');
    await upsertMyProfile(owner.id, profile('case-taken'));
    await signInAs(await newUser('CREATIVE'));
    const res = await putProfile(profile('CASE-Taken'));
    expect(res.status).toBe(409);
    expect((await res.json()) as ApiErrorBody).toEqual({
      error: { code: 'CONFLICT', message: '@case-taken is taken. Try another handle.' },
    });
  });

  it('answers a reserved handle with 400', async () => {
    await signInAs(await newUser('CREATIVE'));
    const res = await putProfile(profile('admin'));
    expect(res.status).toBe(400);
    expect(((await res.json()) as ApiErrorBody).error.code).toBe('VALIDATION_ERROR');
  });

  it('never lets one creative edit another’s profile, even when the body names them', async () => {
    const victim = await newUser('CREATIVE');
    await upsertMyProfile(victim.id, profile('victim-stall'));
    const attacker = await newUser('CREATIVE');
    await signInAs(attacker);

    const res = await putProfile({ ...profile('attacker-stall'), userId: victim.id, displayName: 'Changed' });
    expect(res.status).toBe(200);
    expect((await getCreativeProfile(victim.id))?.displayName).toBe('Ese');
    expect((await getCreativeProfile(attacker.id))?.handle).toBe('attacker-stall');
  });
});

describe('GET /api/creatives/[handle]', () => {
  it('returns the public profile and never the PayPal email', async () => {
    const creative = await newUser('CREATIVE');
    await upsertMyProfile(creative.id, profile('public-stall'));

    const res = await fetchStorefront('Public-Stall');
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain('paypalEmail');
    expect(text).not.toContain('public-stall-shop@example.com');
    expect(text).not.toContain(creative.id);

    const body = JSON.parse(text) as StorefrontResponse;
    expect(Object.keys(body.creative).sort()).toEqual(
      ['avatarUrl', 'country', 'craft', 'createdAt', 'displayName', 'handle', 'isDemo', 'location', 'story'].sort(),
    );
    expect(body.creative).toMatchObject({ handle: 'public-stall', craft: 'Beadwork', isDemo: false });
  });

  it('answers an unknown handle with 404 and the standard error shape', async () => {
    const res = await fetchStorefront('nobody-here');
    expect(res.status).toBe(404);
    expect(((await res.json()) as ApiErrorBody).error.code).toBe('NOT_FOUND');
  });

  it('serves the demo creatives straight away, labelled as demo makers', async () => {
    const res = await fetchStorefront('ese');
    expect(res.status).toBe(200);
    expect(((await res.json()) as StorefrontResponse).creative).toMatchObject({ handle: 'ese', isDemo: true });
    expect((await fetchStorefront('kemi')).status).toBe(200);
  }, 15_000);
});

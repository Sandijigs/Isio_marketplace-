import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';
import { ApiError } from '@/lib/api';
import type { ApiErrorBody, MeResponse } from '@/types/shared';

// An in-memory Postgres with the real migrations, and a controllable cookie jar.
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

const { signUp, authenticate } = await import('@/services/catalog/accounts');
const { createSessionToken, requireCreative, requireUser, getSession } = await import('@/services/catalog/session');
const { GET: getMe } = await import('@/app/api/auth/me/route');
const { POST: postSignUp } = await import('@/app/api/auth/signup/route');
const { POST: postSignIn } = await import('@/app/api/auth/signin/route');
const { POST: postSignOut } = await import('@/app/api/auth/signout/route');

beforeAll(async () => {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../drizzle') });
  state.db = db as unknown as Database;
}, 30_000);

beforeEach(() => {
  state.cookie = undefined;
});

let counter = 0;
function uniqueEmail(prefix: string) {
  counter += 1;
  return `${prefix}-${counter}@example.com`;
}

async function signInAs(role: 'BUYER' | 'CREATIVE') {
  const user = await signUp({ name: role === 'BUYER' ? 'Tobi' : 'Ese', email: uniqueEmail(role), password: 'market-day', role });
  state.cookie = await createSessionToken(user.id);
  return user;
}

async function expectApiError(promise: Promise<unknown>, code: string, status: number) {
  const err = await promise.catch((e: unknown) => e);
  expect(err).toBeInstanceOf(ApiError);
  expect((err as ApiError).code).toBe(code);
  expect((err as ApiError).status).toBe(status);
}

function jsonRequest(url: string, body: unknown) {
  return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}

describe('role guards', () => {
  it('rejects anonymous visitors', async () => {
    expect(await getSession()).toBeNull();
    await expectApiError(requireUser(), 'UNAUTHORIZED', 401);
    await expectApiError(requireCreative(), 'UNAUTHORIZED', 401);
  });

  it('rejects a forged or garbage cookie', async () => {
    state.cookie = 'not-a-real-session';
    await expectApiError(requireUser(), 'UNAUTHORIZED', 401);
  });

  it('rejects a valid token for an account that no longer exists', async () => {
    state.cookie = await createSessionToken('deleted-user-id');
    await expectApiError(requireUser(), 'UNAUTHORIZED', 401);
  });

  it('lets a buyer in as a user but not as a creative', async () => {
    const buyer = await signInAs('BUYER');
    expect((await requireUser()).id).toBe(buyer.id);
    await expectApiError(requireCreative(), 'FORBIDDEN', 403);
  });

  it('lets a creative through both guards', async () => {
    const creative = await signInAs('CREATIVE');
    expect((await requireUser()).id).toBe(creative.id);
    expect((await requireCreative()).role).toBe('CREATIVE');
  });
});

describe('accounts', () => {
  it('refuses a second account for the same email', async () => {
    const email = uniqueEmail('dup');
    await signUp({ name: 'Ese', email, password: 'market-day', role: 'CREATIVE' });
    await expectApiError(signUp({ name: 'Ese again', email, password: 'market-day', role: 'BUYER' }), 'CONFLICT', 409);
  });

  it('authenticates only with the right password', async () => {
    const email = uniqueEmail('auth');
    await signUp({ name: 'Tobi', email, password: 'market-day', role: 'BUYER' });
    expect((await authenticate({ email, password: 'market-day' }))?.email).toBe(email);
    expect(await authenticate({ email, password: 'wrong-password' })).toBeNull();
    expect(await authenticate({ email: uniqueEmail('nobody'), password: 'market-day' })).toBeNull();
  });
});

describe('auth routes', () => {
  it('GET /api/auth/me answers anonymous visitors with the standard error shape', async () => {
    const res = await getMe();
    expect(res.status).toBe(401);
    expect((await res.json()) as ApiErrorBody).toEqual({
      error: { code: 'UNAUTHORIZED', message: 'Sign in to continue.' },
    });
  });

  it('GET /api/auth/me returns the signed-in user', async () => {
    const creative = await signInAs('CREATIVE');
    const res = await getMe();
    expect(res.status).toBe(200);
    const body = (await res.json()) as MeResponse;
    expect(body.user.id).toBe(creative.id);
    expect(body.creativeProfile).toBeNull(); // onboarding (F3) creates it
  });

  it('sign-up sets an httpOnly, lax session cookie and normalises the email', async () => {
    const email = uniqueEmail('Route').toUpperCase();
    const res = await postSignUp(
      jsonRequest('http://localhost/api/auth/signup', { name: ' Kemi ', email, password: 'market-day', role: 'CREATIVE' }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as MeResponse;
    expect(body.user).toMatchObject({ name: 'Kemi', email: email.toLowerCase(), role: 'CREATIVE' });
    const cookie = res.headers.get('set-cookie') ?? '';
    expect(cookie).toMatch(/^isio_session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toMatch(/Max-Age=2592000/);
  });

  it('sign-up rejects bad input with VALIDATION_ERROR', async () => {
    const res = await postSignUp(
      jsonRequest('http://localhost/api/auth/signup', { name: 'Tobi', email: 'not-an-email', password: 'short', role: 'BUYER' }),
    );
    expect(res.status).toBe(400);
    expect(((await res.json()) as ApiErrorBody).error.code).toBe('VALIDATION_ERROR');
  });

  it('sign-up refuses non-JSON posts', async () => {
    const res = await postSignUp(
      new Request('http://localhost/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: '{}',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('sign-in works for the demo accounts and rejects a wrong password without saying which part was wrong', async () => {
    const ok = await postSignIn(jsonRequest('http://localhost/api/auth/signin', { email: 'tobi@example.com', password: 'market-day' }));
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie')).toMatch(/^isio_session=/);

    const bad = await postSignIn(jsonRequest('http://localhost/api/auth/signin', { email: 'tobi@example.com', password: 'nope-nope' }));
    expect(bad.status).toBe(401);
    expect(((await bad.json()) as ApiErrorBody).error.code).toBe('UNAUTHORIZED');
  }, 15_000);

  it('sign-out clears the cookie, and a form post goes back home', async () => {
    const json = await postSignOut(new Request('http://localhost/api/auth/signout', { method: 'POST' }));
    expect(json.status).toBe(200);
    expect(json.headers.get('set-cookie')).toMatch(/isio_session=;.*Max-Age=0/i);

    const form = await postSignOut(
      new Request('http://localhost/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );
    expect(form.status).toBe(303);
    expect(form.headers.get('location')).toBe('http://localhost/');
  });
});

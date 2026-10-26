import { SignJWT } from 'jose';
import { describe, expect, it, vi } from 'vitest';

import {
  createSessionToken,
  resolveSessionSecret,
  SESSION_MAX_AGE_SECONDS,
  verifySessionToken,
} from '@/services/catalog/session';

// session.ts imports next/headers for getSession; these tests only use the token helpers.
vi.mock('next/headers', () => ({ cookies: vi.fn() }));

const secret = new TextEncoder().encode('a'.repeat(32));
const otherSecret = new TextEncoder().encode('b'.repeat(32));
const issuedAt = new Date('2026-10-07T12:00:00Z');
const at = (seconds: number) => new Date(issuedAt.getTime() + seconds * 1000);

describe('session tokens', () => {
  it('round-trips the user id', async () => {
    const token = await createSessionToken('user-1', { secret, now: issuedAt });
    expect(await verifySessionToken(token, { secret, now: issuedAt })).toBe('user-1');
  });

  it('lasts 30 days, then expires', async () => {
    const token = await createSessionToken('user-1', { secret, now: issuedAt });
    expect(SESSION_MAX_AGE_SECONDS).toBe(30 * 24 * 60 * 60);
    expect(await verifySessionToken(token, { secret, now: at(SESSION_MAX_AGE_SECONDS - 60) })).toBe('user-1');
    expect(await verifySessionToken(token, { secret, now: at(SESSION_MAX_AGE_SECONDS + 60) })).toBeNull();
  });

  it('rejects a token signed with another secret', async () => {
    const token = await createSessionToken('user-1', { secret: otherSecret, now: issuedAt });
    expect(await verifySessionToken(token, { secret, now: issuedAt })).toBeNull();
  });

  it('rejects a tampered token', async () => {
    const token = await createSessionToken('user-1', { secret, now: issuedAt });
    const [header, payload, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'someone-else', iss: 'isio', exp: 9999999999 })).toString('base64url');
    expect(await verifySessionToken(`${header}.${forged}.${signature}`, { secret, now: issuedAt })).toBeNull();
    expect(await verifySessionToken(`${header}.${payload}.x${signature}`, { secret, now: issuedAt })).toBeNull();
  });

  it('rejects garbage and tokens without a user', async () => {
    expect(await verifySessionToken('not-a-token', { secret })).toBeNull();
    const noSubject = await new SignJWT({}).setProtectedHeader({ alg: 'HS256' }).setIssuer('isio').sign(secret);
    expect(await verifySessionToken(noSubject, { secret })).toBeNull();
  });
});

describe('session secret', () => {
  it('uses SESSION_SECRET when set', () => {
    const value = 'x'.repeat(40);
    expect(new TextDecoder().decode(resolveSessionSecret({ SESSION_SECRET: value, NODE_ENV: 'production' }))).toBe(value);
  });

  it('refuses a short secret', () => {
    expect(() => resolveSessionSecret({ SESSION_SECRET: 'short', NODE_ENV: 'development' })).toThrow(/at least 32/);
  });

  it('fails loudly in production without a secret', () => {
    expect(() => resolveSessionSecret({ SESSION_SECRET: undefined, NODE_ENV: 'production' })).toThrow(/required in production/);
  });

  it('falls back to a fixed demo secret in development, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const a = resolveSessionSecret({ SESSION_SECRET: undefined, NODE_ENV: 'development' });
    const b = resolveSessionSecret({ SESSION_SECRET: undefined, NODE_ENV: 'development' });
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

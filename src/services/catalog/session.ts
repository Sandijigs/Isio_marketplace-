import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api';
import { type Env, env } from '@/lib/env';
import type { User } from '@/types/shared';

import { getUserById } from './accounts';

/**
 * Stateless sessions: a jose-signed (HS256) token in an httpOnly cookie.
 * The token carries only the user id; the user is re-read on every request,
 * so a deleted account stops working at once. Routes and pages use
 * getSession / requireUser / requireCreative and never parse cookies by hand.
 */

export const SESSION_COOKIE = 'isio_session';
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

const ISSUER = 'isio';
const MIN_SECRET_LENGTH = 32;
// Demo mode only: lets `pnpm dev` work with zero config. Never accepted in production.
const DEMO_SESSION_SECRET = 'isio-demo-mode-session-secret-do-not-use-in-production';

let warnedAboutDemoSecret = false;

export function resolveSessionSecret(e: Pick<Env, 'SESSION_SECRET' | 'NODE_ENV'>): Uint8Array {
  if (e.SESSION_SECRET) {
    if (e.SESSION_SECRET.length < MIN_SECRET_LENGTH) {
      throw new Error(`SESSION_SECRET must be at least ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -hex 32`);
    }
    return new TextEncoder().encode(e.SESSION_SECRET);
  }
  if (e.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET is required in production. Generate one with: openssl rand -hex 32');
  }
  if (e.NODE_ENV === 'development' && !warnedAboutDemoSecret) {
    warnedAboutDemoSecret = true;
    console.warn('SESSION_SECRET is not set: using the fixed demo-mode secret. Set it before deploying.');
  }
  return new TextEncoder().encode(DEMO_SESSION_SECRET);
}

interface TokenOptions {
  secret?: Uint8Array;
  now?: Date;
}

export async function createSessionToken(userId: string, options: TokenOptions = {}): Promise<string> {
  const now = Math.floor((options.now ?? new Date()).getTime() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuer(ISSUER)
    .setIssuedAt(now)
    .setExpirationTime(now + SESSION_MAX_AGE_SECONDS)
    .sign(options.secret ?? resolveSessionSecret(env));
}

/** The user id in a valid, unexpired token; null for anything else. */
export async function verifySessionToken(token: string, options: TokenOptions = {}): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, options.secret ?? resolveSessionSecret(env), {
      algorithms: ['HS256'],
      issuer: ISSUER,
      currentDate: options.now,
    });
    return typeof payload.sub === 'string' && payload.sub !== '' ? payload.sub : null;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
} as const;

/** Sign the user in on this response. */
export async function startSession(response: NextResponse, userId: string): Promise<void> {
  response.cookies.set(SESSION_COOKIE, await createSessionToken(userId), {
    ...cookieOptions,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function endSession(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
}

/** The signed-in user, or null. Only touches the database when a valid cookie is present. */
export async function getSession(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const userId = await verifySessionToken(token);
  return userId ? getUserById(userId) : null;
}

export async function requireUser(): Promise<User> {
  const user = await getSession();
  if (!user) throw new ApiError('UNAUTHORIZED', 'Sign in to continue.');
  return user;
}

export async function requireCreative(): Promise<User> {
  const user = await requireUser();
  if (user.role !== 'CREATIVE') throw new ApiError('FORBIDDEN', 'Only creatives can do this. Sign in with a creative account.');
  return user;
}

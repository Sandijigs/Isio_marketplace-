import { eq } from 'drizzle-orm';

import { getDb, schema } from '@/db/client';
import { ApiError } from '@/lib/api';
import type { User } from '@/types/shared';

import type { SignInInput, SignUpInput } from './auth-input';
import { hashPassword, verifyPassword } from './password';

type UserRow = typeof schema.users.$inferSelect;

function toUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, role: row.role, createdAt: row.createdAt.toISOString() };
}

/** Create an account. Emails arrive lowercased from `signUpInput`. */
export async function signUp(input: SignUpInput): Promise<User> {
  const passwordHash = await hashPassword(input.password);
  // Insert-or-nothing on the unique email, so two simultaneous sign-ups can't both win.
  const [row] = await getDb()
    .insert(schema.users)
    .values({ email: input.email, name: input.name, role: input.role, passwordHash })
    .onConflictDoNothing({ target: schema.users.email })
    .returning();
  if (!row) throw new ApiError('CONFLICT', 'An account with that email already exists. Sign in instead.');
  return toUser(row);
}

/** The user for these credentials, or null. Never says which part was wrong. */
export async function authenticate(input: SignInInput): Promise<User | null> {
  const [row] = await getDb().select().from(schema.users).where(eq(schema.users.email, input.email)).limit(1);
  const ok = await verifyPassword(input.password, row?.passwordHash ?? null);
  return ok && row ? toUser(row) : null;
}

export async function getUserById(id: string): Promise<User | null> {
  const [row] = await getDb().select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return row ? toUser(row) : null;
}

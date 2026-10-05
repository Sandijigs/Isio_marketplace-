import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';

import { env } from '@/lib/env';

import * as schema from './schema';

/** One type for both drivers, so call sites never care which one is live. */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

// Survive Next.js dev hot-reloads without opening a new connection each time.
const globalForDb = globalThis as unknown as { __isioDb?: Database };

export function getDb(): Database {
  if (globalForDb.__isioDb) return globalForDb.__isioDb;

  const db = env.DATABASE_URL
    ? // prepare:false keeps Supabase/Neon transaction poolers happy.
      drizzlePostgres(postgres(env.DATABASE_URL, { prepare: false }), { schema })
    : drizzlePglite(new PGlite(env.PGLITE_DIR), { schema });

  globalForDb.__isioDb = db as unknown as Database;
  return globalForDb.__isioDb;
}

export { schema };

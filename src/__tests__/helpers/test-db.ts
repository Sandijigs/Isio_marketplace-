import path from 'node:path';

import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

import type { Database } from '@/db/client';
import * as schema from '@/db/schema';

/** A fresh in-memory Postgres with the real migrations applied. No files, no network. */
export async function createTestDb(): Promise<Database> {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: path.resolve(__dirname, '../../../drizzle') });
  return db as unknown as Database;
}

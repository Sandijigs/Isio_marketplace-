/**
 * Apply SQL migrations from ./drizzle to whichever database is configured.
 *   pnpm db:migrate
 * Without DATABASE_URL this creates/updates the embedded PGlite DB in ./.data/isio.
 */
import { mkdirSync } from 'node:fs';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { migrate as migratePostgres } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const migrationsFolder = './drizzle';

async function main() {
  const url = process.env.DATABASE_URL?.trim();

  if (url) {
    const client = postgres(url, { max: 1, prepare: false });
    await migratePostgres(drizzlePostgres(client), { migrationsFolder });
    await client.end();
    console.log('Migrations applied to Postgres.');
    return;
  }

  const dir = process.env.PGLITE_DIR ?? './.data/isio';
  mkdirSync(dir, { recursive: true });
  const client = new PGlite(dir);
  await migratePglite(drizzlePglite(client), { migrationsFolder });
  await client.close();
  console.log(`Migrations applied to the local PGlite database in ${dir}.`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

import { defineConfig } from 'drizzle-kit';

// With DATABASE_URL set, drizzle-kit talks to real Postgres (Supabase/Neon).
// Without it, it uses the local embedded PGlite database in ./.data/isio.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  ...(url
    ? { dbCredentials: { url } }
    : { driver: 'pglite' as const, dbCredentials: { url: './.data/isio' } }),
});

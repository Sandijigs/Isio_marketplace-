/**
 * Fill the database with the demo catalog: five fictional makers and their stalls.
 *   pnpm db:seed
 * Idempotent: run it as often as you like; it only adds what is missing.
 * Run `pnpm db:migrate` first. PGlite allows one process at a time, so stop
 * `pnpm dev` before seeding the local database (the dev server seeds itself on boot anyway).
 */
import { seedDemoData } from '@/services/catalog/demo-seed';

import { getDb } from './client';

async function main() {
  const db = getDb();
  await seedDemoData({ db });
  // Close the connection so PGlite flushes to disk and the process can exit.
  const client = (db as unknown as { $client: { close?: () => Promise<void>; end?: () => Promise<void> } }).$client;
  await (client.close ?? client.end)?.call(client);
  console.log('Demo catalog seeded.');
}

main().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});

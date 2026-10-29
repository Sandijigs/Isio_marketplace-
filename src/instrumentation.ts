/**
 * Runs once when the server boots. In demo mode it seeds the demo catalog, so
 * a fresh disk (Render's free tier wipes it on every restart) has stalls to
 * browse before anyone visits. Pages also seed lazily, so a failure here only
 * logs: it never stops the server.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { ensureDemoData } = await import('@/services/catalog/demo-seed');
  try {
    await ensureDemoData();
  } catch (err) {
    console.warn('Demo seed on boot failed; pages will retry. Run `pnpm db:migrate` if the tables are missing.', err);
  }
}

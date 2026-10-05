import { NextResponse } from 'next/server';

import { modes } from '@/lib/env';

/** GET /api/health — liveness plus which integrations are live vs simulated. */
export function GET() {
  return NextResponse.json({
    ok: true,
    modes, // { payments: 'mock' | 'paypal', ai: 'mock' | 'live', db: 'pglite' | 'postgres' }
  });
}

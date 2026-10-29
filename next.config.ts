import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships a WASM Postgres; keep it out of the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],

  // Storefronts live at /@handle. A folder named "@..." is a parallel-route slot
  // in the App Router, so the page sits at /storefront/[handle] and this maps the URL.
  async rewrites() {
    return [{ source: '/@:handle', destination: '/storefront/:handle' }];
  },
};

export default nextConfig;

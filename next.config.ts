import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // PGlite ships a WASM Postgres; keep it out of the server bundle.
  serverExternalPackages: ['@electric-sql/pglite'],
};

export default nextConfig;

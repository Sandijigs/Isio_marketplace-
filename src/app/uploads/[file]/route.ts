import { readLocalImage } from '@/services/catalog/images';

/**
 * GET /uploads/[file] — serves photos from the local image store. They can't
 * live in public/: `next start` only serves public files that existed when the
 * server booted, so anything uploaded afterwards would 404 in production.
 * Names are random (or fixed seed names with fixed content), so files never
 * change and can be cached for good.
 */
export async function GET(_request: Request, context: { params: Promise<{ file: string }> }) {
  const image = await readLocalImage((await context.params).file);
  if (!image) return new Response('Not found', { status: 404 });
  return new Response(new Uint8Array(image.bytes), {
    headers: {
      'Content-Type': image.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

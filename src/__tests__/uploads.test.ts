import { existsSync } from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { env } from '@/lib/env';
import type { ApiErrorBody, UploadResponse } from '@/types/shared';

import { createTestDb } from './helpers/test-db';

const state = vi.hoisted(() => ({ db: null as unknown, cookie: undefined as string | undefined }));

vi.mock('@/db/client', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  getDb: () => state.db,
}));

vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => (name === 'isio_session' && state.cookie ? { name, value: state.cookie } : undefined),
  }),
}));

const { signUp } = await import('@/services/catalog/accounts');
const { createSessionToken } = await import('@/services/catalog/session');
const { POST: upload } = await import('@/app/api/uploads/route');
const { GET: serveUpload } = await import('@/app/uploads/[file]/route');

let creative: { id: string };
let buyer: { id: string };

beforeAll(async () => {
  state.db = await createTestDb();
  creative = await signUp({ name: 'Ese', email: 'upload-creative@example.com', password: 'market-day', role: 'CREATIVE' });
  buyer = await signUp({ name: 'Tobi', email: 'upload-buyer@example.com', password: 'market-day', role: 'BUYER' });
}, 30_000);

beforeEach(async () => {
  state.cookie = await createSessionToken(creative.id);
});

async function png(width: number, height: number): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: '#e5533a' } }).png().toBuffer();
}

function send(...files: File[]) {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  return upload(new Request('http://localhost/api/uploads', { method: 'POST', body: form }));
}

async function messageOf(res: Response) {
  return ((await res.json()) as ApiErrorBody).error.message;
}

describe('POST /api/uploads', () => {
  it('is for creatives only', async () => {
    const file = new File([new Uint8Array(await png(10, 10))], 'a.png', { type: 'image/png' });
    state.cookie = undefined;
    expect((await send(file)).status).toBe(401);
    state.cookie = await createSessionToken(buyer.id);
    expect((await send(file)).status).toBe(403);
  });

  it('resizes to 2000px wide and stores the photo where /uploads serves it', async () => {
    const res = await send(new File([new Uint8Array(await png(2400, 1200))], 'wide.png', { type: 'image/png' }));
    expect(res.status).toBe(201);
    const [image] = ((await res.json()) as UploadResponse).images;
    expect(image).toMatchObject({ width: 2000, height: 1000, url: expect.stringMatching(/^\/uploads\/[a-f0-9-]+\.png$/) });

    const name = image!.url.replace('/uploads/', '');
    expect(existsSync(path.join(env.UPLOADS_DIR, name))).toBe(true);
    const served = await serveUpload(new Request(`http://localhost${image!.url}`), { params: Promise.resolve({ file: name }) });
    expect(served.status).toBe(200);
    expect(served.headers.get('content-type')).toBe('image/png');
  });

  it('never enlarges a small photo', async () => {
    const res = await send(new File([new Uint8Array(await png(800, 600))], 'small.png', { type: 'image/png' }));
    expect(((await res.json()) as UploadResponse).images[0]).toMatchObject({ width: 800, height: 600 });
  });

  it('accepts JPEG and WebP too', async () => {
    const jpeg = await sharp(await png(50, 50)).jpeg().toBuffer();
    const webp = await sharp(await png(50, 50)).webp().toBuffer();
    const res = await send(
      new File([new Uint8Array(jpeg)], 'a.jpg', { type: 'image/jpeg' }),
      new File([new Uint8Array(webp)], 'b.webp', { type: 'image/webp' }),
    );
    expect(res.status).toBe(201);
    const urls = ((await res.json()) as UploadResponse).images.map((i) => i.url);
    expect(urls[0]).toMatch(/\.jpg$/);
    expect(urls[1]).toMatch(/\.webp$/);
  });

  it('refuses other file types', async () => {
    const gif = await sharp(await png(10, 10)).gif().toBuffer();
    const res = await send(new File([new Uint8Array(gif)], 'a.gif', { type: 'image/gif' }));
    expect(res.status).toBe(400);
    expect(await messageOf(res)).toBe('Photos must be JPEG, PNG or WebP.');
  });

  it('reads the format from the bytes, not the label the browser sent', async () => {
    const res = await send(new File(['<script>alert(1)</script>'], 'fake.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(400);
    expect(await messageOf(res)).toMatch(/isn’t a photo/);
  });

  it('refuses photos over 8 MB', async () => {
    const res = await send(new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'huge.jpg', { type: 'image/jpeg' }));
    expect(res.status).toBe(400);
    expect(await messageOf(res)).toMatch(/over 8 MB/);
  });

  it('takes 1 to 8 photos at a time', async () => {
    expect((await send()).status).toBe(400);
    const bytes = new Uint8Array(await png(10, 10));
    const nine = Array.from({ length: 9 }, (_, i) => new File([bytes], `${i}.png`, { type: 'image/png' }));
    const res = await send(...nine);
    expect(res.status).toBe(400);
    expect(await messageOf(res)).toBe('Upload up to 8 photos at a time.');
    expect((await send(...nine.slice(0, 8))).status).toBe(201);
  });
});

describe('GET /uploads/[file]', () => {
  it('serves only stored names, never a path outside the store', async () => {
    for (const file of ['../../package.json', '..%2F..%2Fpackage.json', 'nope.jpg', 'x.svg']) {
      const res = await serveUpload(new Request('http://localhost/uploads/x'), { params: Promise.resolve({ file }) });
      expect(res.status, file).toBe(404);
    }
  });
});

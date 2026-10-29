import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { ApiError } from '@/lib/api';
import { env } from '@/lib/env';
import type { UploadedImage } from '@/types/shared';

/**
 * Listing photos: checked, resized and stored. Routes and the seed go through
 * `saveImage` and an `ImageStore`, so a cloud store (Vercel Blob, Cloudinary)
 * can replace the local disk without touching them.
 */

export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const IMAGE_MAX_WIDTH = 2000;
export const UPLOAD_MAX_FILES = 8;

const FORMATS = {
  jpeg: { ext: 'jpg', contentType: 'image/jpeg' },
  png: { ext: 'png', contentType: 'image/png' },
  webp: { ext: 'webp', contentType: 'image/webp' },
} as const;

type Format = keyof typeof FORMATS;
export type ImageExt = (typeof FORMATS)[Format]['ext'];

const ACCEPTED_TYPES: ReadonlySet<string> = new Set(Object.values(FORMATS).map((f) => f.contentType));
const CONTENT_TYPE_BY_EXT: Record<ImageExt, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

/** Stored names: a uuid (uploads) or "demo-<photo>" (seed), plus the extension. */
export const STORED_NAME = /^[a-z0-9-]+\.(jpg|png|webp)$/;

export interface ImageStore {
  /** Save under `name` (see STORED_NAME) and return the URL browsers load it from. */
  put(name: string, bytes: Buffer, contentType: string): Promise<string>;
  /** The URL for `name` if it is already stored, else null. Lets the seed skip work it has done. */
  find(name: string): Promise<string | null>;
}

/** Writes into UPLOADS_DIR; /uploads/[file] serves the files (see that route for why not public/). */
export function localImageStore(dir: string = env.UPLOADS_DIR): ImageStore {
  return {
    async put(name, bytes) {
      assertStoredName(name);
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), bytes);
      return `/uploads/${name}`;
    },
    async find(name) {
      assertStoredName(name);
      try {
        return (await stat(path.join(dir, name))).isFile() ? `/uploads/${name}` : null;
      } catch {
        return null;
      }
    },
  };
}

export function getImageStore(): ImageStore {
  return localImageStore();
}

/** Read a locally stored image for the /uploads route; null for anything not stored. */
export async function readLocalImage(
  name: string,
  dir: string = env.UPLOADS_DIR,
): Promise<{ bytes: Buffer; contentType: string } | null> {
  const match = STORED_NAME.exec(name);
  if (!match) return null;
  try {
    return { bytes: await readFile(path.join(dir, name)), contentType: CONTENT_TYPE_BY_EXT[match[1] as ImageExt] };
  } catch {
    return null;
  }
}

function assertStoredName(name: string): void {
  if (!STORED_NAME.test(name)) throw new Error(`Not a valid stored image name: ${name}`);
}

export interface ProcessedImage {
  bytes: Buffer;
  ext: ImageExt;
  contentType: string;
  width: number;
  height: number;
}

/**
 * Check a photo and shrink it to at most 2000px wide. The format is read from
 * the bytes, not trusted from the browser. Photos are turned upright and
 * stripped of metadata, which also drops any GPS location a phone embedded.
 */
export async function processImage(bytes: Uint8Array, declaredType: string): Promise<ProcessedImage> {
  if (!ACCEPTED_TYPES.has(declaredType)) throw new ApiError('VALIDATION_ERROR', 'Photos must be JPEG, PNG or WebP.');
  if (bytes.byteLength > IMAGE_MAX_BYTES) throw new ApiError('VALIDATION_ERROR', 'Each photo must be 8 MB or smaller.');

  let format: Format;
  try {
    const meta = await sharp(bytes).metadata();
    if (meta.format !== 'jpeg' && meta.format !== 'png' && meta.format !== 'webp') throw new Error('unsupported');
    format = meta.format;
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'That file isn’t a photo Isio can read. Use a JPEG, PNG or WebP.');
  }

  const pipeline = sharp(bytes).rotate().resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true });
  const encoded =
    format === 'jpeg'
      ? pipeline.jpeg({ quality: 82, mozjpeg: true })
      : format === 'png'
        ? pipeline.png({ compressionLevel: 9 })
        : pipeline.webp({ quality: 82 });
  const { data, info } = await encoded.toBuffer({ resolveWithObject: true });
  return { bytes: data, ext: FORMATS[format].ext, contentType: FORMATS[format].contentType, width: info.width, height: info.height };
}

/**
 * Process and store a batch of photos under fresh names. All or nothing:
 * every photo is checked before any is stored, so one bad file never leaves
 * half a batch behind. Results keep the order they were given in.
 */
export async function saveImages(
  files: ReadonlyArray<{ bytes: Uint8Array; type: string }>,
  store: ImageStore = getImageStore(),
): Promise<UploadedImage[]> {
  const processed = await Promise.all(files.map((f) => processImage(f.bytes, f.type)));
  return Promise.all(
    processed.map(async (image) => ({
      url: await store.put(`${crypto.randomUUID()}.${image.ext}`, image.bytes, image.contentType),
      width: image.width,
      height: image.height,
    })),
  );
}

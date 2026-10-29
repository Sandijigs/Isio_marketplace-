import { NextResponse } from 'next/server';

import { ApiError, withApi } from '@/lib/api';
import { IMAGE_MAX_BYTES, saveImages, UPLOAD_MAX_FILES } from '@/services/catalog/images';
import { requireCreative } from '@/services/catalog/session';
import type { UploadResponse } from '@/types/shared';

// Room for the multipart boundaries around eight full-size photos.
const MAX_BODY_BYTES = UPLOAD_MAX_FILES * IMAGE_MAX_BYTES + 64 * 1024;

/**
 * POST /api/uploads — multipart form with 1–8 `files`. Each is checked
 * (JPEG/PNG/WebP, 8 MB max), resized to 2000px wide and stored. All or
 * nothing: one bad file rejects the batch before anything is saved.
 */
export const POST = withApi(async (request: Request) => {
  await requireCreative();

  if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data')) {
    throw new ApiError('VALIDATION_ERROR', 'Send photos as a file upload.');
  }
  const declaredLength = Number(request.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_BODY_BYTES) throw new ApiError('VALIDATION_ERROR', 'Each photo must be 8 MB or smaller.');

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ApiError('VALIDATION_ERROR', 'The upload didn’t come through. Try again.');
  }

  const files = form.getAll('files').filter((f): f is File => f instanceof File);
  if (files.length === 0) throw new ApiError('VALIDATION_ERROR', 'Choose at least one photo.');
  if (files.length > UPLOAD_MAX_FILES) throw new ApiError('VALIDATION_ERROR', `Upload up to ${UPLOAD_MAX_FILES} photos at a time.`);
  for (const file of files) {
    if (file.size > IMAGE_MAX_BYTES) throw new ApiError('VALIDATION_ERROR', `${file.name || 'A photo'} is over 8 MB. Choose a smaller photo.`);
  }

  const images = await saveImages(
    await Promise.all(files.map(async (f) => ({ bytes: new Uint8Array(await f.arrayBuffer()), type: f.type }))),
  );
  return NextResponse.json<UploadResponse>({ images }, { status: 201 });
});

'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';

import { buttonClasses } from '@/components/ui/button-link';
import { FieldError } from '@/components/ui/field-parts';
import { TextField } from '@/components/ui/text-field';
import { ALT_MAX, LISTING_IMAGES_MAX } from '@/services/catalog/listing-input';
import type { ApiErrorBody, ListingImage, UploadResponse } from '@/types/shared';

// Mirrors the server's limits (src/services/catalog/images.ts) so a wrong file fails before it's sent.
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 8 * 1024 * 1024;

export const PHOTOS_ADD_ID = 'listing-photos-add';

function isApiError(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'error' in body;
}

/** Photos for a listing: upload, pick the cover, describe each one. The first photo is the cover. */
export function PhotoPicker({
  images,
  onChange,
  error,
  disabled = false,
}: Readonly<{ images: ListingImage[]; onChange: (images: ListingImage[]) => void; error?: string | null; disabled?: boolean }>) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const room = LISTING_IMAGES_MAX - images.length;

  async function upload(fileList: FileList | null) {
    const files = Array.from(fileList ?? []);
    if (input.current) input.current.value = '';
    if (files.length === 0) return;
    setUploadError(null);

    const wrongType = files.find((f) => !ACCEPT.includes(f.type));
    if (wrongType) return setUploadError(`${wrongType.name} isn’t a JPEG, PNG or WebP photo.`);
    const tooBig = files.find((f) => f.size > MAX_BYTES);
    if (tooBig) return setUploadError(`${tooBig.name} is over 8 MB. Choose a smaller photo.`);
    if (files.length > room) {
      return setUploadError(
        room === 0
          ? `A listing can have up to ${LISTING_IMAGES_MAX} photos. Remove one to add another.`
          : `You can add ${room} more ${room === 1 ? 'photo' : 'photos'} (up to ${LISTING_IMAGES_MAX} in all).`,
      );
    }

    const form = new FormData();
    for (const file of files) form.append('files', file);
    setUploading(files.length);
    try {
      const res = await fetch('/api/uploads', { method: 'POST', body: form });
      const body: unknown = await res.json().catch(() => null);
      if (res.ok) {
        onChange([...images, ...(body as UploadResponse).images.map((img) => ({ url: img.url, alt: '' }))]);
      } else {
        setUploadError(isApiError(body) ? body.error.message : 'Couldn’t upload your photos. Try again.');
      }
    } catch {
      setUploadError('Couldn’t reach Isio. Check your connection and try again.');
    } finally {
      setUploading(0);
    }
  }

  function setAlt(index: number, alt: string) {
    onChange(images.map((img, i) => (i === index ? { ...img, alt } : img)));
  }

  function makeCover(index: number) {
    const chosen = images[index];
    if (chosen) onChange([chosen, ...images.filter((_, i) => i !== index)]);
  }

  function remove(index: number) {
    onChange(images.filter((_, i) => i !== index));
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-4" aria-describedby="listing-photos-hint">
      <legend className="mb-1.5 text-[17px] font-bold">Photos</legend>
      <p id="listing-photos-hint" className="-mt-2 text-[15px] font-medium text-ink/75">
        Up to {LISTING_IMAGES_MAX} photos: JPEG, PNG or WebP, 8 MB each. The first one is the cover buyers see first.
      </p>

      {images.length > 0 ? (
        <ol className="flex flex-col gap-4">
          {images.map((image, index) => (
            <li key={image.url} className="flex flex-col gap-3 border-2 border-ink p-3">
              <div className="flex items-start gap-3">
                <div className="relative size-[88px] shrink-0 overflow-hidden border-2 border-ink bg-line">
                  <Image src={image.url} alt="" fill sizes="88px" className="object-cover" />
                </div>
                <div className="flex min-w-0 flex-col items-start gap-2">
                  <span className="text-base font-bold">
                    {index === 0 ? (
                      <span className="rounded-full border border-raffia-deep bg-raffia px-3 py-1 text-sm">Cover photo</span>
                    ) : (
                      `Photo ${index + 1}`
                    )}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {index > 0 ? (
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => makeCover(index)}
                        className={`${buttonClasses('outline', 'sm')} cursor-pointer`}
                      >
                        Make cover<span className="sr-only">: photo {index + 1}</span>
                      </button>
                    ) : null}
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => remove(index)}
                      className={`${buttonClasses('outline', 'sm')} cursor-pointer`}
                    >
                      Remove<span className="sr-only"> photo {index + 1}</span>
                    </button>
                  </div>
                </div>
              </div>
              <TextField
                id={`listing-photo-alt-${index}`}
                label={`Describe photo ${index + 1} (optional)`}
                hint="For buyers who can’t see the photo, like “Red coral necklace on a white cloth”."
                maxLength={ALT_MAX}
                value={image.alt}
                disabled={disabled}
                onChange={(e) => setAlt(index, e.target.value)}
              />
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-2 border-dashed border-line-strong bg-raffia-tint px-4 py-6 text-base font-semibold">
          No photos yet. Good light and a plain background help buyers see your work.
        </p>
      )}

      <input
        ref={input}
        type="file"
        accept={ACCEPT.join(',')}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(e) => void upload(e.target.files)}
      />
      <button
        id={PHOTOS_ADD_ID}
        type="button"
        disabled={disabled || uploading > 0 || room === 0}
        aria-describedby={error || uploadError ? 'listing-photos-error' : undefined}
        onClick={() => input.current?.click()}
        className={`${buttonClasses('outline', 'md')} cursor-pointer self-start disabled:cursor-not-allowed`}
      >
        {uploading > 0
          ? `Uploading ${uploading === 1 ? 'photo' : `${uploading} photos`}…`
          : images.length === 0
            ? 'Add photos'
            : room === 0
              ? `${LISTING_IMAGES_MAX} photos added`
              : 'Add more photos'}
      </button>
      <div aria-live="polite">
        <FieldError id="listing-photos" error={uploadError ?? error} />
      </div>
    </fieldset>
  );
}

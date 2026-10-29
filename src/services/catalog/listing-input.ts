import { z } from 'zod';

import { LISTING_CATEGORIES, type ListingCategory, type ListingImage, type ListingKind, type ListingStatus } from '@/types/shared';

/**
 * Listing input and publish rules, validated at the API boundary and reused by
 * the studio form so the creative sees exactly what's missing before saving.
 * No server imports, so the browser can load it.
 */

export const LISTING_IMAGES_MAX = 8;
export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 5000;
export const STORY_MAX = 3000;
export const ALT_MAX = 200;
/** $10,000. A guard against typos (an extra zero), not a business rule. */
export const PRICE_MAX_CENTS = 1_000_000;
export const SHIPPING_MAX_CENTS = 100_000;
export const STOCK_MAX = 9_999;
export const TURNAROUND_MAX_DAYS = 365;

/**
 * The URL shape the local image store hands out. Listings may only point at
 * photos Isio stored, never at arbitrary sites. Widen this when a cloud store lands.
 */
export const STORED_IMAGE_URL = /^\/uploads\/[a-z0-9-]+\.(?:jpg|png|webp)$/;

const listingImage = z.object({
  url: z.string().regex(STORED_IMAGE_URL, 'Upload photos through Isio.'),
  alt: z.string().trim().max(ALT_MAX, `Keep photo descriptions under ${ALT_MAX} characters.`),
});

const cents = (max: number, label: string) =>
  z
    .number(`Enter ${label} as a number.`)
    .int(`Enter ${label} in whole cents.`)
    .min(0, `${label[0]?.toUpperCase()}${label.slice(1)} can’t be negative.`)
    .max(max, `That ${label} looks too high. Check it and try again.`);

/**
 * Everything a creative can set. Drafts may be incomplete (empty title, no
 * category, price 0); publishing checks completeness separately, so a
 * half-finished draft is never lost.
 */
export const listingInput = z.object({
  kind: z.enum(['PRODUCT', 'SERVICE'], 'Choose a finished piece or a made-to-order service.'),
  title: z.string().trim().max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters.`),
  description: z.string().trim().max(DESCRIPTION_MAX, `Keep the description under ${DESCRIPTION_MAX} characters.`),
  story: z
    .string()
    .trim()
    .max(STORY_MAX, `Keep the story under ${STORY_MAX} characters.`)
    .nullable()
    .default(null)
    .transform((v) => (v ? v : null)),
  category: z.enum(LISTING_CATEGORIES, 'Choose a category from the list.').nullable(),
  priceCents: cents(PRICE_MAX_CENTS, 'price'),
  shippingCents: cents(SHIPPING_MAX_CENTS, 'shipping'),
  stock: z
    .number('Enter how many you have as a number.')
    .int('Enter how many you have as a whole number.')
    .min(0, 'How many you have can’t be negative.')
    .max(STOCK_MAX, 'That’s more than Isio can track. Leave it blank for made to order.')
    .nullable(),
  turnaroundDays: z
    .number('Enter the days it takes as a number.')
    .int('Enter the days it takes as a whole number.')
    .min(1, 'It takes at least one day.')
    .max(TURNAROUND_MAX_DAYS, 'Keep it within a year.')
    .nullable(),
  images: z.array(listingImage).max(LISTING_IMAGES_MAX, `Add up to ${LISTING_IMAGES_MAX} photos.`),
});

export type ListingInput = z.infer<typeof listingInput>;

export const LISTING_STATUSES = ['DRAFT', 'ACTIVE', 'SOLD_OUT', 'ARCHIVED'] as const satisfies readonly ListingStatus[];

/** PATCH body: any subset of the fields, and optionally a new status. */
export const listingPatch = listingInput.partial().extend({
  status: z.enum(LISTING_STATUSES, 'That isn’t a listing status.').optional(),
});

export type ListingPatch = z.infer<typeof listingPatch>;

/**
 * DRAFT → ACTIVE ↔ SOLD_OUT, and anything → ARCHIVED. Archived is final, and a
 * published listing never goes back to being a draft.
 */
const NEXT_STATUSES: Record<ListingStatus, readonly ListingStatus[]> = {
  DRAFT: ['ACTIVE', 'ARCHIVED'],
  ACTIVE: ['SOLD_OUT', 'ARCHIVED'],
  SOLD_OUT: ['ACTIVE', 'ARCHIVED'],
  ARCHIVED: [],
};

export function canMoveTo(from: ListingStatus, to: ListingStatus): boolean {
  return NEXT_STATUSES[from].includes(to);
}

/** The statuses that need a complete listing: it is (or was just) in front of buyers. */
export function isPublished(status: ListingStatus): boolean {
  return status === 'ACTIVE' || status === 'SOLD_OUT';
}

export type PublishField = 'title' | 'description' | 'category' | 'images' | 'priceCents' | 'turnaroundDays' | 'paypalEmail';

export interface PublishGap {
  field: PublishField;
  label: string; // reads after "To publish, add ..."
}

export interface PublishCandidate {
  kind: ListingKind;
  title: string;
  description: string;
  category: ListingCategory | null;
  priceCents: number;
  turnaroundDays: number | null;
  images: readonly ListingImage[];
}

/**
 * Exactly what stands between a listing and going live, in form order. Empty
 * means it can be published. The PayPal email matters because buyers pay the
 * creative directly: without it there is nowhere for the money to go.
 */
export function publishGaps(listing: PublishCandidate, hasPaypalEmail: boolean): PublishGap[] {
  const gaps: PublishGap[] = [];
  if (listing.images.length === 0) gaps.push({ field: 'images', label: 'at least one photo' });
  if (!listing.title.trim()) gaps.push({ field: 'title', label: 'a title' });
  if (!listing.description.trim()) gaps.push({ field: 'description', label: 'a description' });
  if (!listing.category) gaps.push({ field: 'category', label: 'a category' });
  if (listing.priceCents <= 0) gaps.push({ field: 'priceCents', label: 'a price above $0' });
  if (listing.kind === 'SERVICE' && !listing.turnaroundDays) {
    gaps.push({ field: 'turnaroundDays', label: 'how many days it takes to make' });
  }
  if (!hasPaypalEmail) gaps.push({ field: 'paypalEmail', label: 'your PayPal email, in your stall details' });
  return gaps;
}

/** "a title, a category and at least one photo" */
export function listGaps(gaps: readonly PublishGap[]): string {
  const labels = gaps.map((g) => g.label);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
}

export const CATEGORY_LABEL: Record<ListingCategory, string> = {
  painting: 'Painting',
  sculpture: 'Sculpture',
  textiles: 'Textiles',
  fashion: 'Fashion',
  beadwork: 'Beadwork',
  jewelry: 'Jewellery',
  leather: 'Leather',
  pottery: 'Pottery',
  woodwork: 'Woodwork',
  photography: 'Photography',
  illustration: 'Illustration',
  other: 'Something else',
};

export const STATUS_LABEL: Record<ListingStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Live',
  SOLD_OUT: 'Sold out',
  ARCHIVED: 'Archived',
};

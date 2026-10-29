import { z } from 'zod';

/**
 * Creative profile input, validated at the API boundary and reused by the
 * studio form for instant feedback. No server imports, so the browser can load it.
 */

/**
 * Handles that would look official or collide with Isio's own words. Storefronts
 * live under /@, so these can't clash with routes, but "isio.app/@admin" selling
 * beads would mislead buyers. ("me", the API's own-profile path, is already
 * too short to be a handle.)
 */
export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  'studio',
  'signin',
  'signup',
  'api',
  'explore',
  'admin',
  'assistant',
  'isio',
  'paypal',
  'checkout',
  'orders',
  'commissions',
]);

export const HANDLE_MIN = 3;
export const HANDLE_MAX = 30;

export const handleSchema = z
  .string({ error: 'Choose a handle.' })
  .trim()
  .toLowerCase()
  .min(HANDLE_MIN, { error: `Use at least ${HANDLE_MIN} characters for your handle.` })
  .max(HANDLE_MAX, { error: `Keep your handle to ${HANDLE_MAX} characters or fewer.` })
  .regex(/^[a-z0-9-]+$/, { error: 'Use only letters, numbers and hyphens in your handle.' })
  // Edge hyphens make links that look broken when shared ("isio.app/@-ese-").
  .refine((h) => !h.startsWith('-') && !h.endsWith('-'), { error: 'Start and end your handle with a letter or number.' })
  .refine((h) => !RESERVED_HANDLES.has(h), { error: 'That handle is reserved. Try another.' });

/** Blank optional fields are stored as null, not "". */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, { error: tooLong })
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const profileInput = z.object({
  handle: handleSchema,
  displayName: z
    .string({ error: 'Enter the name buyers will see.' })
    .trim()
    .min(1, { error: 'Enter the name buyers will see.' })
    .max(80, { error: 'Keep your name under 80 characters.' }),
  craft: z
    .string({ error: 'Say what you make, like “Beadwork”.' })
    .trim()
    .min(2, { error: 'Say what you make, like “Beadwork”.' })
    .max(60, { error: 'Keep your craft under 60 characters.' }),
  location: optionalText(80, 'Keep your location under 80 characters.'),
  story: optionalText(2000, 'Keep your story under 2,000 characters.'),
  // Optional while setting up; required before publishing a priced listing (F4).
  paypalEmail: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .nullable()
    .transform((v) => (v ? v : null))
    .pipe(z.email({ error: 'Enter the email address of your PayPal account.' }).nullable()),
});

export type ProfileInput = z.infer<typeof profileInput>;
export type ProfileFormValues = z.input<typeof profileInput>;

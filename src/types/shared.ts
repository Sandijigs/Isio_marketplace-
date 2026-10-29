/**
 * Shared types — the single source of truth for every cross-area boundary
 * (Catalog ↔ Commerce ↔ Experience ↔ AI). Don't invent shapes elsewhere:
 * if a field is missing, add it here first, then use it.
 *
 * Money is always integer minor units (cents) plus a currency code.
 * Never use floats for money. PayPal wants decimal strings — convert at the
 * PayPal boundary only (see src/lib/money.ts).
 */

// ── Money ─────────────────────────────────────────────────────────────────────

export type CurrencyCode = 'USD';

export interface Money {
  cents: number; // integer minor units, always >= 0
  currency: CurrencyCode;
}

// ── People ────────────────────────────────────────────────────────────────────

export type UserRole = 'BUYER' | 'CREATIVE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string; // ISO 8601
}

export interface CreativeProfile {
  userId: string;
  handle: string; // URL-safe, unique: isio.app/@handle
  displayName: string;
  craft: string; // e.g. "Beadwork", "Adire textiles", "Portrait painting"
  story: string | null; // the creative's own words about their work
  location: string | null; // e.g. "Warri, Delta State"
  country: string; // ISO 3166-1 alpha-2, default "NG"
  avatarUrl: string | null;
  /** Where buyers' payments go. Isio never holds creatives' money. */
  paypalEmail: string | null;
  createdAt: string;
}

// ── Accounts ──────────────────────────────────────────────────────────────────

/** POST /api/auth/signup and /api/auth/signin respond with the signed-in user. */
export interface AuthResponse {
  user: User;
}

/** GET /api/auth/me. `creativeProfile` is null for buyers and for creatives before onboarding. */
export interface MeResponse {
  user: User;
  creativeProfile: CreativeProfile | null;
}

/**
 * A shared account for trying Isio, listed on the sign-in page whenever Isio
 * is not taking live payments. Fictional people only.
 */
export interface DemoAccount {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  description: string; // e.g. "Buyer in Toronto"
}

/**
 * What anyone may see about a creative. Never includes `paypalEmail`: that is
 * for the creative and for Commerce's server-side checkout only.
 */
export interface PublicCreativeProfile {
  handle: string;
  displayName: string;
  craft: string;
  story: string | null;
  location: string | null;
  country: string;
  avatarUrl: string | null;
  /** A fictional demo maker, labelled as such on the storefront. */
  isDemo: boolean;
  createdAt: string;
}

/** GET /api/creatives/[handle]. `listings` holds only the creative's ACTIVE listings, newest first. */
export interface StorefrontResponse {
  creative: PublicCreativeProfile;
  listings: Listing[];
}

/** PUT /api/creatives/me. The owner's own view, so `paypalEmail` is included. */
export interface MyProfileResponse {
  creativeProfile: CreativeProfile;
}

// ── Catalog ───────────────────────────────────────────────────────────────────

/** A PRODUCT ships a finished piece. A SERVICE is made to order (commission). */
export type ListingKind = 'PRODUCT' | 'SERVICE';

export type ListingStatus = 'DRAFT' | 'ACTIVE' | 'SOLD_OUT' | 'ARCHIVED';

export const LISTING_CATEGORIES = [
  'painting',
  'sculpture',
  'textiles',
  'fashion',
  'beadwork',
  'jewelry',
  'leather',
  'pottery',
  'woodwork',
  'photography',
  'illustration',
  'other',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

/** A listing photo. The first one in a listing is its cover. */
export interface ListingImage {
  url: string; // what the browser loads: /uploads/... from the local store, a full URL from a cloud store
  alt: string; // written by the creative; empty means "use the title"
}

export interface Listing {
  id: string;
  creativeId: string;
  creativeHandle: string;
  creativeName: string;
  kind: ListingKind;
  status: ListingStatus;
  title: string;
  description: string;
  story: string | null; // the piece's story, in the creative's voice
  category: ListingCategory | null; // null only while a draft
  price: Money; // for SERVICE: the starting price ("from $X"). 0 only while a draft
  shipping: Money;
  stock: number | null; // PRODUCT only; null = made to order
  turnaroundDays: number | null; // SERVICE only
  images: ListingImage[]; // 0–8; at least 1 once published
  tags: string[];
  aiDrafted: boolean; // true if the creative started from an AI draft
  createdAt: string;
  updatedAt: string;
}

/** POST /api/listings, GET and PATCH /api/listings/[id]. */
export interface ListingResponse {
  listing: Listing;
}

/** One stored photo from POST /api/uploads, already resized. */
export interface UploadedImage {
  url: string;
  width: number;
  height: number;
}

/** POST /api/uploads. Images come back in the order they were sent. */
export interface UploadResponse {
  images: UploadedImage[];
}

// ── Commerce ──────────────────────────────────────────────────────────────────

export type OrderStatus =
  | 'PENDING' // created, waiting for the buyer to approve in PayPal
  | 'PAID' // PayPal capture completed
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface Order {
  id: string;
  buyerId: string;
  creativeId: string;
  listingId: string;
  listingTitle: string;
  quantity: number;
  subtotal: Money;
  shipping: Money;
  total: Money;
  status: OrderStatus;
  paypalOrderId: string | null;
  paypalCaptureId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  paidAt: string | null;
  shippedAt: string | null;
}

export type CommissionStatus =
  | 'REQUESTED' // buyer sent a brief
  | 'QUOTED' // creative sent a quote (often starting from an AI draft)
  | 'DEPOSIT_PAID'
  | 'IN_PROGRESS'
  | 'DELIVERED'
  | 'COMPLETED' // balance paid
  | 'CANCELLED';

export interface Commission {
  id: string;
  buyerId: string;
  creativeId: string;
  listingId: string | null;
  brief: string; // the buyer's own words
  structuredBrief: StructuredBrief | null; // AI-organised version, creative-approved
  quote: Money | null;
  deposit: Money | null;
  status: CommissionStatus;
  dueDate: string | null;
  createdAt: string;
}

// ── AI ────────────────────────────────────────────────────────────────────────

/** What the listing studio returns. A draft: the creative edits before publishing. */
export interface ListingDraft {
  title: string;
  description: string;
  story: string;
  category: ListingCategory;
  materials: string[];
  tags: string[];
  suggestedPrice: Money;
  priceRationale: string; // plain-language reason for the suggested price
}

/** A buyer's commission request, organised so a creative can quote it fast. */
export interface StructuredBrief {
  summary: string;
  deliverables: string[];
  measurements: string | null;
  colours: string[];
  deadline: string | null;
  openQuestions: string[]; // things the creative should ask before quoting
  suggestedQuote: Money | null;
}

// ── API errors ────────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'PAYMENT_FAILED'
  | 'AI_UNAVAILABLE'
  | 'INTERNAL_ERROR';

/** Every API error response has exactly this shape. Clients switch on `code`. */
export interface ApiErrorBody {
  error: { code: ApiErrorCode; message: string };
}

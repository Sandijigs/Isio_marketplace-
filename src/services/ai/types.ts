import type { ListingDraft, StructuredBrief } from '@/types/shared';

/**
 * The only AI interface the rest of Isio talks to. AI drafts; people decide.
 * Nothing an AI provider returns is ever published, charged or sent without
 * a human confirming it first.
 */

export interface DraftListingInput {
  /** Whatever the creative said or typed, in any language (English, Pidgin, Urhobo...). */
  notes: string;
  /** Public image URLs of the piece (the first is the cover). */
  imageUrls: string[];
  craft?: string; // the creative's stated craft, for context
  location?: string;
}

export interface StructureBriefInput {
  /** The buyer's commission request, in their own words. */
  brief: string;
  craft: string;
  startingPriceCents?: number; // the creative's "from $X" for this service
}

export interface AiProvider {
  readonly name: 'mock' | 'live';
  readonly model: string;
  draftListing(input: DraftListingInput): Promise<ListingDraft>;
  structureBrief(input: StructureBriefInput): Promise<StructuredBrief>;
}

export class AiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiError';
  }
}

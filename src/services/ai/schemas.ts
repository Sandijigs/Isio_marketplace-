import { z } from 'zod';

import { LISTING_CATEGORIES } from '@/types/shared';

/**
 * Zod schemas for every structured AI output. The model is forced to answer
 * in these shapes, then results are mapped onto the shared types.
 * Prices are integer cents, never floats.
 */

const cents = z.number().int().min(0);

export const listingDraftSchema = z.object({
  title: z.string().min(3).max(80).describe('Short, specific product title a buyer would search for'),
  description: z.string().min(20).max(1200).describe('What it is: size, materials, how it is made, care'),
  story: z.string().max(600).describe("The piece's story in the creative's own voice, first person"),
  category: z.enum(LISTING_CATEGORIES),
  materials: z.array(z.string()).max(8),
  tags: z.array(z.string()).max(10),
  suggestedPriceCents: cents.describe('Suggested price in US cents for international buyers'),
  priceRationale: z.string().max(300).describe('One or two plain sentences explaining the price'),
});

export type ListingDraftOutput = z.infer<typeof listingDraftSchema>;

export const structuredBriefSchema = z.object({
  summary: z.string().max(400),
  deliverables: z.array(z.string()).max(10),
  measurements: z.string().nullable(),
  colours: z.array(z.string()).max(8),
  deadline: z.string().nullable().describe('ISO date if the buyer gave one, else null'),
  openQuestions: z.array(z.string()).max(6).describe('What the creative must ask before quoting'),
  suggestedQuoteCents: cents.nullable(),
});

export type StructuredBriefOutput = z.infer<typeof structuredBriefSchema>;

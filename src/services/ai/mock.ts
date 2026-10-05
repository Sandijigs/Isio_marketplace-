import { money } from '@/lib/money';
import type { ListingCategory, ListingDraft, StructuredBrief } from '@/types/shared';

import type { AiProvider, DraftListingInput, StructureBriefInput } from './types';

/**
 * Deterministic mock AI: realistic, clearly-labelled drafts with no API key.
 * Lets the whole app (and its tests) run offline. Swap to live by setting
 * ANTHROPIC_API_KEY.
 */

const CATEGORY_HINTS: Array<[RegExp, ListingCategory]> = [
  [/bead|coral/i, 'beadwork'],
  [/adire|fabric|textile|weav|aso.?oke|kente/i, 'textiles'],
  [/paint|canvas|acrylic|oil/i, 'painting'],
  [/sculpt|bronze|carv/i, 'sculpture'],
  [/dress|tailor|ankara|kaftan|agbada/i, 'fashion'],
  [/leather|bag|sandal/i, 'leather'],
  [/pot|clay|ceramic/i, 'pottery'],
  [/photo|shoot/i, 'photography'],
  [/wood/i, 'woodwork'],
];

function guessCategory(text: string): ListingCategory {
  return CATEGORY_HINTS.find(([re]) => re.test(text))?.[1] ?? 'other';
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  return (trimmed.split(/[.!?\n]/)[0] ?? trimmed).slice(0, 70) || 'Handmade piece';
}

export const mockAiProvider: AiProvider = {
  name: 'mock',
  model: 'mock-v1',

  async draftListing(input: DraftListingInput): Promise<ListingDraft> {
    const source = `${input.craft ?? ''} ${input.notes}`;
    const category = guessCategory(source);
    const title = firstSentence(input.notes).replace(/^\w/, (c) => c.toUpperCase());
    return {
      title,
      description: `${title}. Handmade${input.location ? ` in ${input.location}` : ''}. [Demo draft: the live AI writes a full description from your photos and notes.]`,
      story: input.notes.trim().slice(0, 600),
      category,
      materials: [],
      tags: [category, 'handmade', 'african-art'],
      suggestedPrice: money(category === 'painting' || category === 'sculpture' ? 12000 : 4500),
      priceRationale: 'Demo estimate based on the category. The live AI weighs materials, labour and comparable work.',
    };
  },

  async structureBrief(input: StructureBriefInput): Promise<StructuredBrief> {
    return {
      summary: input.brief.trim().slice(0, 400),
      deliverables: [firstSentence(input.brief)],
      measurements: null,
      colours: [],
      deadline: null,
      openQuestions: ['What size do you need?', 'Any colours to include or avoid?', 'When do you need it delivered?'],
      suggestedQuote: input.startingPriceCents ? money(input.startingPriceCents) : null,
    };
  },
};

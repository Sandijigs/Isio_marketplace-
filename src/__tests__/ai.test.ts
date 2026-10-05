import { describe, expect, it } from 'vitest';

import { mockAiProvider } from '@/services/ai/mock';
import { listingDraftSchema, structuredBriefSchema } from '@/services/ai/schemas';

describe('mock AI', () => {
  it('drafts a listing from notes in Pidgin', async () => {
    const draft = await mockAiProvider.draftListing({
      notes: 'Na coral bead necklace wey I make for wedding season. E get three layers.',
      imageUrls: ['https://example.com/necklace.jpg'],
      craft: 'Beadwork',
      location: 'Warri',
    });
    expect(draft.category).toBe('beadwork');
    expect(draft.suggestedPrice.cents).toBeGreaterThan(0);
    expect(Number.isInteger(draft.suggestedPrice.cents)).toBe(true);
    expect(draft.story).toContain('coral bead');
  });

  it('organises a commission brief and asks the missing questions', async () => {
    const brief = await mockAiProvider.structureBrief({
      brief: 'I want a portrait of my parents for their 40th anniversary.',
      craft: 'Portrait painting',
      startingPriceCents: 15000,
    });
    expect(brief.openQuestions.length).toBeGreaterThan(0);
    expect(brief.suggestedQuote?.cents).toBe(15000);
  });
});

describe('AI output schemas', () => {
  it('reject float prices from the model', () => {
    const result = listingDraftSchema.safeParse({
      title: 'Coral necklace',
      description: 'A three-layer coral bead necklace, hand-strung.',
      story: 'I made this for wedding season.',
      category: 'beadwork',
      materials: ['coral beads'],
      tags: ['beadwork'],
      suggestedPriceCents: 45.5,
      priceRationale: 'Comparable work sells for about this.',
    });
    expect(result.success).toBe(false);
  });

  it('accept a well-formed brief', () => {
    const result = structuredBriefSchema.safeParse({
      summary: 'Anniversary portrait of two people',
      deliverables: ['One painted portrait'],
      measurements: null,
      colours: [],
      deadline: null,
      openQuestions: ['What size?'],
      suggestedQuoteCents: null,
    });
    expect(result.success).toBe(true);
  });
});

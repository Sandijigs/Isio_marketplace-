import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, Output } from 'ai';

import { money } from '@/lib/money';
import type { ListingDraft, StructuredBrief } from '@/types/shared';

import { BRIEF_SYSTEM_PROMPT, LISTING_SYSTEM_PROMPT } from './prompts';
import { listingDraftSchema, structuredBriefSchema } from './schemas';
import type { AiProvider, DraftListingInput, StructureBriefInput } from './types';
import { AiError } from './types';

/**
 * Live AI via the Vercel AI SDK + Claude. Structured output is enforced with
 * zod schemas (Output.object), so results always match the shared types.
 * Untested against the live API until a key is added: first task of the
 * listing-studio feature is to run it with a real key and tune the prompt.
 */
export function createAnthropicProvider(apiKey: string, model: string): AiProvider {
  const anthropic = createAnthropic({ apiKey });

  return {
    name: 'live',
    model,

    async draftListing(input: DraftListingInput): Promise<ListingDraft> {
      const context = [
        input.craft ? `Craft: ${input.craft}` : null,
        input.location ? `Location: ${input.location}` : null,
        `The creative's notes: ${input.notes}`,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const { output } = await generateText({
          model: anthropic(model),
          system: LISTING_SYSTEM_PROMPT,
          output: Output.object({ schema: listingDraftSchema }),
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: context },
                ...input.imageUrls.slice(0, 4).map((url) => ({ type: 'image' as const, image: new URL(url) })),
              ],
            },
          ],
        });
        return {
          title: output.title,
          description: output.description,
          story: output.story,
          category: output.category,
          materials: output.materials,
          tags: output.tags,
          suggestedPrice: money(output.suggestedPriceCents),
          priceRationale: output.priceRationale,
        };
      } catch (err) {
        throw new AiError('The listing draft could not be generated', err);
      }
    },

    async structureBrief(input: StructureBriefInput): Promise<StructuredBrief> {
      const prompt = [
        `Creative's craft: ${input.craft}`,
        input.startingPriceCents ? `Their starting price for this service: ${input.startingPriceCents} US cents` : null,
        `Buyer's request: ${input.brief}`,
      ]
        .filter(Boolean)
        .join('\n');

      try {
        const { output } = await generateText({
          model: anthropic(model),
          system: BRIEF_SYSTEM_PROMPT,
          output: Output.object({ schema: structuredBriefSchema }),
          prompt,
        });
        return {
          summary: output.summary,
          deliverables: output.deliverables,
          measurements: output.measurements,
          colours: output.colours,
          deadline: output.deadline,
          openQuestions: output.openQuestions,
          suggestedQuote: output.suggestedQuoteCents === null ? null : money(output.suggestedQuoteCents),
        };
      } catch (err) {
        throw new AiError('The brief could not be organised', err);
      }
    },
  };
}

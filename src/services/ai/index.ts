import { env, modes } from '@/lib/env';

import { createAnthropicProvider } from './anthropic';
import { mockAiProvider } from './mock';
import type { AiProvider } from './types';

let provider: AiProvider | null = null;

/** The AI provider for the current mode (mock without ANTHROPIC_API_KEY). */
export function getAiProvider(): AiProvider {
  if (provider) return provider;

  if (modes.ai === 'live') {
    if (!env.ANTHROPIC_API_KEY) throw new Error('AI_MODE=live needs ANTHROPIC_API_KEY');
    provider = createAnthropicProvider(env.ANTHROPIC_API_KEY, env.AI_MODEL);
  } else {
    provider = mockAiProvider;
  }
  return provider;
}

export type { AiProvider, DraftListingInput, StructureBriefInput } from './types';
export { AiError } from './types';

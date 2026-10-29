import { cache } from 'react';

import { getCreativeByHandle } from '@/services/catalog/creatives';
import { ensureDemoAccounts } from '@/services/catalog/demo-accounts';

/** One lookup per request, shared by the layout, metadata and page. */
export const loadCreative = cache(async (handle: string) => {
  await ensureDemoAccounts();
  return getCreativeByHandle(handle);
});

import { cache } from 'react';

import { getCreativeByHandle } from '@/services/catalog/creatives';
import { ensureDemoData } from '@/services/catalog/demo-seed';

/** One lookup per request, shared by the layout, metadata and page. */
export const loadCreative = cache(async (handle: string) => {
  await ensureDemoData();
  return getCreativeByHandle(handle);
});

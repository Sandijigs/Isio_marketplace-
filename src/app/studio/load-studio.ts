import { cache } from 'react';

import { getCreativeProfile } from '@/services/catalog/creatives';
import { getSession } from '@/services/catalog/session';

/** The signed-in user and, for creatives, their profile. One lookup per request across the studio's layouts and pages. */
export const loadStudio = cache(async () => {
  const user = await getSession();
  const profile = user?.role === 'CREATIVE' ? await getCreativeProfile(user.id) : null;
  return { user, profile };
});

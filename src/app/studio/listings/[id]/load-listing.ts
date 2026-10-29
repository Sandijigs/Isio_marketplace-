import { cache } from 'react';

import { getListing } from '@/services/catalog/listings';

import { loadStudio } from '../../load-studio';

/** The listing if the signed-in creative owns it, else null. Shared by the layout and the page. */
export const loadOwnListing = cache(async (id: string) => {
  const { user } = await loadStudio();
  if (!user || user.role !== 'CREATIVE') return null;
  const listing = await getListing(id, user.id);
  return listing && listing.creativeId === user.id ? listing : null;
});

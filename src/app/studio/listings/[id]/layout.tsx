import { notFound } from 'next/navigation';

import { loadStudio } from '../../load-studio';

import { loadOwnListing } from './load-listing';

/**
 * The ownership check lives here, before the page streams behind loading.tsx,
 * so someone else's listing (or a bad id) gets a real 404. Buyers fall
 * through to the page, which shows them the studio's "for makers" notice.
 */
export default async function EditListingLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ id: string }> }>) {
  const { user } = await loadStudio();
  if (user?.role === 'CREATIVE' && !(await loadOwnListing((await params).id))) notFound();
  return children;
}

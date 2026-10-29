import { redirect } from 'next/navigation';

import { PageFrame } from '@/components/site/page-frame';
import { getSession } from '@/services/catalog/session';

/**
 * The sign-in check lives here rather than in the page: the page streams
 * behind loading.tsx, and once streaming starts the server can no longer send
 * a real 307. Checking in the layout redirects before any HTML goes out.
 */
export default async function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  if (!(await getSession())) redirect('/signin?next=/studio');
  return <PageFrame>{children}</PageFrame>;
}

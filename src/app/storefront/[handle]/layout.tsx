import { notFound } from 'next/navigation';

import { PageFrame } from '@/components/site/page-frame';

import { loadCreative } from './load-creative';

/**
 * Checking the handle here, before the page streams behind loading.tsx, lets
 * an unknown handle return a real 404 instead of a 200 with the not-found page.
 */
export default async function StorefrontLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ handle: string }> }>) {
  if (!(await loadCreative((await params).handle))) notFound();
  return <PageFrame>{children}</PageFrame>;
}

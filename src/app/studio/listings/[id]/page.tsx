import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { ListingForm, type ListingNotice } from '@/components/studio/listing-form';
import { MakersOnly, SetUpStallFirst, StudioHeading } from '@/components/studio/makers-only';
import { env } from '@/lib/env';

import { loadStudio } from '../../load-studio';

import { loadOwnListing } from './load-listing';

type Props = Readonly<{ params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }>;

export const metadata: Metadata = { title: 'Edit listing · Isio' };

// Set by the new-listing form when it hands over to this page.
const NOTICE_FROM_PARAM: Record<string, ListingNotice> = { draft: 'draft', published: 'published' };

export default async function EditListingPage({ params, searchParams }: Props) {
  const { user, profile } = await loadStudio();
  if (!user) redirect('/signin?next=/studio');
  if (user.role !== 'CREATIVE') return <MakersOnly name={user.name} />;
  if (!profile) return <SetUpStallFirst />;

  const listing = await loadOwnListing((await params).id);
  if (!listing) notFound();
  const saved = (await searchParams).saved;

  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col gap-7">
      <StudioHeading title={listing.title || 'Untitled draft'} />
      <ListingForm
        key={listing.id}
        listing={listing}
        hasPaypalEmail={Boolean(profile.paypalEmail)}
        handle={profile.handle}
        usdToNgnRate={env.DEMO_USD_NGN_RATE}
        initialNotice={saved ? (NOTICE_FROM_PARAM[saved] ?? null) : null}
      />
    </section>
  );
}

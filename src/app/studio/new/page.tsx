import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ListingForm } from '@/components/studio/listing-form';
import { MakersOnly, SetUpStallFirst, StudioHeading } from '@/components/studio/makers-only';
import { env } from '@/lib/env';

import { loadStudio } from '../load-studio';

export const metadata: Metadata = { title: 'List a piece · Isio' };

export default async function NewListingPage() {
  const { user, profile } = await loadStudio();
  if (!user) redirect('/signin?next=/studio/new');
  if (user.role !== 'CREATIVE') return <MakersOnly name={user.name} />;
  if (!profile) return <SetUpStallFirst />;

  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col gap-7">
      <StudioHeading title="List a piece" intro="Save a draft any time. Buyers only see it once you publish." />
      <ListingForm
        listing={null}
        hasPaypalEmail={Boolean(profile.paypalEmail)}
        handle={profile.handle}
        usdToNgnRate={env.DEMO_USD_NGN_RATE}
      />
    </section>
  );
}

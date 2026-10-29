import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { ProfileForm } from '@/components/studio/profile-form';
import { ButtonLink } from '@/components/ui/button-link';
import { env } from '@/lib/env';
import { getCreativeProfile } from '@/services/catalog/creatives';
import { getSession } from '@/services/catalog/session';

export const metadata: Metadata = { title: 'Your studio · Isio' };

export default async function StudioPage() {
  const user = await getSession();
  if (!user) redirect('/signin?next=/studio');

  if (user.role !== 'CREATIVE') {
    return (
      <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col items-start gap-5">
        <h1 id="studio-heading" className="stretch-75 text-[clamp(44px,6vw,80px)] leading-[0.9] font-bold tracking-[-0.025em]">
          The studio is for makers.
        </h1>
        <p className="text-lg font-medium">
          You’re signed in as {user.name}, with a buyer account. Makers use the studio to set up their stall and list
          their work. To sell on Isio, sign out and create a maker account.
        </p>
        <ButtonLink href="/" size="lg">
          Back to the market
        </ButtonLink>
      </section>
    );
  }

  const profile = await getCreativeProfile(user.id);

  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col gap-7">
      <div className="flex flex-col gap-3">
        <h1 id="studio-heading" className="stretch-75 text-[clamp(44px,6vw,80px)] leading-[0.9] font-bold tracking-[-0.025em]">
          {profile ? 'Your stall' : 'Set up your stall'}
        </h1>
        <p className="text-lg font-medium">
          {profile
            ? 'Changes show on your stall as soon as you save.'
            : 'Tell buyers who you are and what you make. You can change any of this later.'}
        </p>
      </div>
      <ProfileForm profile={profile} fallbackName={user.name} siteHost={new URL(env.NEXT_PUBLIC_APP_URL).host} />
    </section>
  );
}

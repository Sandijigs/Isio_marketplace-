import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { MakersOnly, StudioHeading } from '@/components/studio/makers-only';
import { ProfileForm } from '@/components/studio/profile-form';
import { env } from '@/lib/env';

import { loadStudio } from '../load-studio';

export const metadata: Metadata = { title: 'Stall details · Isio' };

export default async function StudioProfilePage() {
  const { user, profile } = await loadStudio();
  if (!user) redirect('/signin?next=/studio/profile');
  if (user.role !== 'CREATIVE') return <MakersOnly name={user.name} />;

  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col gap-7">
      <StudioHeading
        title={profile ? 'Your stall' : 'Set up your stall'}
        intro={
          profile
            ? 'Changes show on your stall as soon as you save.'
            : 'Tell buyers who you are and what you make. You can change any of this later.'
        }
      />
      <ProfileForm profile={profile} fallbackName={user.name} siteHost={new URL(env.NEXT_PUBLIC_APP_URL).host} />
    </section>
  );
}

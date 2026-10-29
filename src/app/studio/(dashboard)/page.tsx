import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { priceLabel } from '@/components/listings/listing-price';
import { MakersOnly, StudioHeading } from '@/components/studio/makers-only';
import { ProfileForm } from '@/components/studio/profile-form';
import { StatusChip } from '@/components/studio/status-chip';
import { ButtonLink } from '@/components/ui/button-link';
import { env } from '@/lib/env';
import { listMyListings } from '@/services/catalog/listings';
import type { Listing } from '@/types/shared';

import { loadStudio } from '../load-studio';

// In a route group so its skeleton (loading.tsx) covers only this page. A loading.tsx at
// /studio would wrap every nested layout too, and the listing editor's 404 check would
// then run after streaming had started, too late to send a real 404.
export const metadata: Metadata = { title: 'Your studio · Isio' };

export default async function StudioPage() {
  const { user, profile } = await loadStudio();
  if (!user) redirect('/signin?next=/studio');
  if (user.role !== 'CREATIVE') return <MakersOnly name={user.name} />;

  const siteHost = new URL(env.NEXT_PUBLIC_APP_URL).host;

  if (!profile) {
    return (
      <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col gap-7">
        <StudioHeading title="Set up your stall" intro="Tell buyers who you are and what you make. You can change any of this later." />
        <ProfileForm profile={null} fallbackName={user.name} siteHost={siteHost} />
      </section>
    );
  }

  const listings = await listMyListings(user.id);
  // Archived pieces sink to the bottom: they're history, not work in progress.
  const ordered = [...listings.filter((l) => l.status !== 'ARCHIVED'), ...listings.filter((l) => l.status === 'ARCHIVED')];

  return (
    <div className="flex flex-col gap-[clamp(32px,5vw,56px)]">
      <section aria-labelledby="studio-heading" className="flex max-w-[720px] flex-col gap-5">
        <StudioHeading
          title="Your studio"
          intro={
            <>
              Your stall is at <span className="font-bold break-all">{siteHost}/@{profile.handle}</span>.
            </>
          }
        />
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={`/@${profile.handle}`} variant="outline">
            View your stall
          </ButtonLink>
          <ButtonLink href="/studio/profile" variant="outline">
            Edit stall details
          </ButtonLink>
        </div>
        {!profile.paypalEmail ? (
          <p className="border-l-4 border-indigo bg-indigo-tint px-4 py-3 text-base font-semibold">
            Add your PayPal email before you publish: buyers pay you there directly.{' '}
            <Link href="/studio/profile" className="text-ink underline underline-offset-4 hover:text-indigo">
              Add it in your stall details
            </Link>
          </p>
        ) : null}
      </section>

      <section aria-labelledby="listings-heading" className="flex flex-col gap-5 border-t-2 border-ink pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 id="listings-heading" className="stretch-80 text-[clamp(28px,3vw,40px)] leading-none font-extrabold">
            Your listings
          </h2>
          {ordered.length > 0 ? (
            <ButtonLink href="/studio/new" size="lg" className="w-full justify-center sm:w-auto">
              List a piece
            </ButtonLink>
          ) : null}
        </div>

        {ordered.length === 0 ? (
          <div className="flex flex-col items-start gap-4 border-2 border-ink bg-raffia-tint p-[clamp(20px,3vw,36px)]">
            <p className="stretch-80 text-[clamp(24px,2.6vw,32px)] leading-none font-extrabold">No listings yet.</p>
            <p className="max-w-[36em] text-lg font-medium">
              Photograph your first piece and tell buyers about it. It stays a draft, just for you, until you publish.
            </p>
            <ButtonLink href="/studio/new" size="lg" className="w-full justify-center sm:w-auto">
              List your first piece
            </ButtonLink>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {ordered.map((listing) => (
              <li key={listing.id}>
                <ListingRow listing={listing} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ListingRow({ listing }: Readonly<{ listing: Listing }>) {
  const cover = listing.images[0];
  const title = listing.title || 'Untitled draft';
  return (
    <Link
      href={`/studio/listings/${listing.id}`}
      className="flex items-center gap-4 border-2 border-ink bg-paper p-3 text-ink no-underline hover:shadow-hard motion-safe:transition-transform motion-safe:hover:-translate-y-0.5"
    >
      <div className="relative flex size-[72px] shrink-0 items-center justify-center overflow-hidden border-2 border-ink bg-line">
        {cover ? (
          <Image src={cover.url} alt="" fill sizes="72px" className="object-cover" />
        ) : (
          <span className="px-1 text-center text-xs font-bold">No photo</span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="stretch-80 text-[clamp(18px,1.6vw,22px)] leading-tight font-extrabold break-words">{title}</span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] font-semibold">
          <StatusChip status={listing.status} />
          <span className="tabular-nums">{listing.price.cents > 0 ? priceLabel(listing) : 'No price yet'}</span>
          <span>{listing.kind === 'SERVICE' ? 'Made to order' : 'Finished piece'}</span>
        </span>
      </div>
    </Link>
  );
}

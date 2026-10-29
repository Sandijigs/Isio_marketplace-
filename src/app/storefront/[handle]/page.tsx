import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ListingCard } from '@/components/listings/listing-card';
import { ButtonLink } from '@/components/ui/button-link';
import { getCreativeProfile } from '@/services/catalog/creatives';
import { listStorefrontListings } from '@/services/catalog/listings';
import { getSession } from '@/services/catalog/session';

import { loadCreative } from './load-creative';

/**
 * A creative's public storefront, served at /@handle (see the rewrite in
 * next.config.ts). Shows only public fields; the PayPal email never reaches this page.
 */

type Props = Readonly<{ params: Promise<{ handle: string }> }>;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const creative = await loadCreative((await params).handle);
  if (!creative) return { title: 'Stall not found · Isio' };
  return {
    title: `${creative.displayName} · Isio`,
    description: `${creative.craft}${creative.location ? ` from ${creative.location}` : ''}. Buy straight from the maker on Isio.`,
  };
}

export default async function StorefrontPage({ params }: Props) {
  const creative = await loadCreative((await params).handle);
  if (!creative) notFound();

  const [viewer, listings] = await Promise.all([getSession(), listStorefrontListings(creative.handle)]);
  const isOwner = viewer?.role === 'CREATIVE' && (await getCreativeProfile(viewer.id))?.handle === creative.handle;
  const initial = creative.displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="flex flex-col gap-[clamp(40px,6vw,80px)]">
      <section aria-labelledby="maker-heading" className="flex flex-col gap-6">
        {creative.isDemo ? (
          <p className="max-w-[40em] border-l-4 border-indigo bg-indigo-tint px-4 py-3 text-base font-semibold">
            Demo stall. {creative.displayName} is a fictional maker, here so you can try Isio.
          </p>
        ) : null}

        <div className="flex flex-wrap items-end gap-x-6 gap-y-5">
          {/* No avatar uploads in v1: every maker gets their initial. */}
          <div
            aria-hidden="true"
            className="stretch-75 flex size-[clamp(96px,14vw,148px)] shrink-0 items-center justify-center rounded-full border-2 border-ink bg-coral text-[clamp(52px,8vw,84px)] leading-none font-extrabold text-ink"
          >
            {initial}
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            <h1
              id="maker-heading"
              className="stretch-75 text-[clamp(52px,7vw,104px)] leading-[0.88] font-bold tracking-[-0.025em] break-words"
            >
              {creative.displayName}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex min-h-9 items-center rounded-full border border-raffia-deep bg-raffia px-4 text-base font-bold text-ink">
                {creative.craft}
              </span>
              {creative.location ? <span className="text-lg font-semibold">{creative.location}</span> : null}
            </div>
          </div>
        </div>

        {isOwner ? (
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/studio">Go to your studio</ButtonLink>
            <ButtonLink href="/studio/profile" variant="outline">
              Edit your profile
            </ButtonLink>
          </div>
        ) : null}
      </section>

      {creative.story ? (
        <section aria-labelledby="story-heading" className="flex max-w-[44em] flex-col gap-4 border-t-2 border-ink pt-8">
          <h2 id="story-heading" className="stretch-80 text-[clamp(28px,3vw,40px)] leading-none font-extrabold">
            In {creative.displayName}’s words
          </h2>
          <p className="text-[clamp(18px,1.4vw,21px)] leading-relaxed font-medium whitespace-pre-line">{creative.story}</p>
        </section>
      ) : null}

      <section aria-labelledby="pieces-heading" className="flex flex-col gap-5 border-t-2 border-ink pt-8">
        <h2 id="pieces-heading" className="stretch-80 text-[clamp(28px,3vw,40px)] leading-none font-extrabold">
          Pieces
        </h2>
        {listings.length > 0 ? (
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,46%),1fr))] gap-[clamp(12px,2vw,28px)]">
            {listings.map((listing) => (
              <li key={listing.id}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-start gap-3 border-2 border-ink bg-raffia-tint p-[clamp(20px,3vw,36px)]">
            <p className="stretch-80 text-[clamp(24px,2.6vw,32px)] leading-none font-extrabold">No pieces yet.</p>
            <p className="max-w-[36em] text-lg font-medium">
              {isOwner
                ? 'Your pieces will show here once you publish them.'
                : `${creative.displayName} hasn’t listed anything yet. Check back soon.`}
            </p>
            {isOwner ? (
              <ButtonLink href="/studio/new" size="lg">
                List a piece
              </ButtonLink>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

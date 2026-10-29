import Image from 'next/image';

import { AvailabilityTag } from '@/components/landing/availability-tag';
import type { Listing } from '@/types/shared';

import { availabilityOf, priceLabel } from './listing-price';

/**
 * A piece on a storefront. Not a link yet: the listing page arrives with
 * explore (F5), and a card that lifts on hover but goes nowhere would mislead.
 */
export function ListingCard({ listing }: Readonly<{ listing: Listing }>) {
  const cover = listing.images[0];
  return (
    <article className="flex h-full flex-col border-2 border-ink bg-paper">
      <div className="relative aspect-square overflow-hidden border-b-2 border-ink bg-line">
        {cover ? (
          <Image
            src={cover.url}
            alt={cover.alt || listing.title}
            fill
            sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 420px"
            className="object-cover"
          />
        ) : null}
        <AvailabilityTag availability={availabilityOf(listing)} className="absolute right-2.5 bottom-2.5" />
      </div>
      <div className="flex flex-col gap-1.5 px-[clamp(12px,1.5vw,20px)] pt-[clamp(12px,1.4vw,18px)] pb-[clamp(14px,1.6vw,22px)]">
        <h3 className="stretch-80 text-[clamp(19px,2vw,28px)] leading-[1.02] font-extrabold">{listing.title}</h3>
        <p className="text-[clamp(16px,1.2vw,18px)] font-bold tabular-nums">{priceLabel(listing)}</p>
      </div>
    </article>
  );
}

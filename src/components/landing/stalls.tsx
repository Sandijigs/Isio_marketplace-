'use client';

import Image from 'next/image';
import { useState } from 'react';

import { AvailabilityTag } from './availability-tag';
import { SAMPLE_LISTINGS } from './sample-listings';
import { filterByAvailability, STALL_FILTERS, type StallFilter } from './stall-filter';

export function Stalls() {
  const [filter, setFilter] = useState<StallFilter>('all');
  const pieces = filterByAvailability(SAMPLE_LISTINGS, filter);

  return (
    <section
      id="market"
      aria-labelledby="market-heading"
      className="mx-auto max-w-[1360px] scroll-mt-4 px-[clamp(16px,4vw,40px)] pt-[clamp(40px,6vw,88px)] pb-[clamp(64px,8vw,112px)]"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-12 gap-y-4">
        <div className="flex flex-col gap-3">
          <h2
            id="market-heading"
            className="stretch-75 text-[clamp(44px,6vw,88px)] leading-[0.9] font-extrabold tracking-[-0.02em]"
          >
            Fresh on the stalls
          </h2>
          <p className="text-[clamp(17px,1.3vw,19px)] font-medium">
            Every piece comes with its maker’s name and hometown.{' '}
            <span className="font-normal">These are sample listings for the demo.</span>
          </p>
        </div>
      </div>

      <div role="group" aria-label="Filter pieces" className="mb-8 flex gap-2.5 overflow-x-auto pb-1">
        {STALL_FILTERS.map((option) => {
          const active = option.value === filter;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => setFilter(option.value)}
              className={`min-h-11 shrink-0 cursor-pointer rounded-full border px-[18px] text-base transition-colors ${
                active
                  ? 'border-ink bg-ink font-bold text-paper'
                  : 'border-line-strong bg-paper font-semibold text-ink hover:border-ink'
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {pieces.length} {pieces.length === 1 ? 'piece' : 'pieces'}
      </p>

      {pieces.length === 0 ? (
        <p className="border-2 border-ink bg-raffia-tint p-8 text-lg font-semibold">
          Nothing on this stall yet. Try another filter.
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(300px,46%),1fr))] gap-[clamp(12px,2vw,28px)]">
          {pieces.map((piece) => (
            <li key={piece.id}>
              <a
                href="#market"
                className="flex h-full flex-col border-2 border-ink bg-paper text-ink no-underline motion-safe:transition-transform motion-safe:hover:-translate-y-1 hover:shadow-hard"
              >
                <div className="relative aspect-square overflow-hidden border-b-2 border-ink">
                  <Image
                    src={piece.image}
                    alt={piece.alt}
                    fill
                    placeholder="blur"
                    sizes="(max-width: 700px) 50vw, (max-width: 1100px) 33vw, 420px"
                    className="object-cover"
                  />
                  <AvailabilityTag availability={piece.availability} className="absolute right-2.5 bottom-2.5" />
                </div>
                <div className="flex flex-col gap-1.5 px-[clamp(12px,1.5vw,20px)] pt-[clamp(12px,1.4vw,18px)] pb-[clamp(14px,1.6vw,22px)]">
                  <span className="stretch-80 text-[clamp(19px,2vw,28px)] leading-[1.02] font-extrabold">
                    {piece.title}
                  </span>
                  <span className="text-[clamp(14px,1.1vw,16px)] font-medium">
                    {piece.maker}, {piece.town}
                  </span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

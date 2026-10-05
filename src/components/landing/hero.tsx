import Image, { type StaticImageData } from 'next/image';

import { AvailabilityTag } from './availability-tag';
import { HERO_PIECES } from './sample-listings';
import type { Availability } from './stall-filter';

function HeroCard({
  piece,
  aspect,
  tag,
  className,
}: Readonly<{
  piece: { title: string; maker: string; town: string; image: StaticImageData; alt: string };
  aspect: string;
  tag?: Availability;
  className: string;
}>) {
  return (
    <figure className={`absolute m-0 border-2 border-ink bg-paper px-2.5 pt-2.5 shadow-hard ${className}`}>
      <div className={`relative overflow-hidden ${aspect}`}>
        <Image
          src={piece.image}
          alt={piece.alt}
          fill
          priority
          placeholder="blur"
          sizes="(max-width: 700px) 45vw, 260px"
          className="object-cover"
        />
        {tag ? <AvailabilityTag availability={tag} className="absolute right-2 bottom-2 text-[13px]" /> : null}
      </div>
      <figcaption className="flex flex-col gap-0.5 px-1 pt-2.5 pb-3">
        <span className="stretch-85 text-[clamp(16px,1.4vw,20px)] leading-[1.05] font-extrabold">{piece.title}</span>
        <span className="text-sm font-medium">
          {piece.maker}, {piece.town}
        </span>
      </figcaption>
    </figure>
  );
}

function PaidStamp() {
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label="Paid straight to the maker, with PayPal" className="size-full">
      <defs>
        <path id="isio-stamp-ring" d="M100,100 m-70,0 a70,70 0 1,1 140,0 a70,70 0 1,1 -140,0" />
      </defs>
      <circle cx="100" cy="100" r="97" className="fill-raffia stroke-ink" strokeWidth="3" />
      <circle cx="100" cy="100" r="50" fill="none" className="stroke-ink" strokeWidth="2" />
      <text className="fill-ink font-sans" fontSize="19" fontWeight="700" letterSpacing="0.5">
        <textPath href="#isio-stamp-ring">Paid straight to the maker, with PayPal, </textPath>
      </text>
      <g transform="translate(76 76) scale(1.5)" fill="none" className="stroke-ink" strokeWidth="2">
        <path d="M6 23 L16 8 L26 18" />
        <circle cx="6" cy="23" r="3" className="fill-ink" />
        <circle cx="16" cy="8" r="4" className="fill-paper" />
        <circle cx="26" cy="18" r="3" className="fill-ink" />
      </g>
    </svg>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="mx-auto flex max-w-[1360px] flex-wrap items-stretch gap-[clamp(32px,4vw,56px)] px-[clamp(16px,4vw,40px)] pt-[clamp(28px,4vw,56px)] pb-[clamp(56px,6vw,88px)]"
    >
      <div className="flex min-w-0 flex-[1_1_540px] flex-col justify-center gap-7">
        <h1
          id="hero-heading"
          className="stretch-75 text-[clamp(56px,6.2vw,100px)] leading-[0.9] font-bold tracking-[-0.025em] text-balance"
        >
          Africa’s <span className="shadow-[inset_0_-0.2em_0_var(--color-raffia)]">makers</span>. The world’s market.
        </h1>
        <p className="max-w-[30em] text-[clamp(18px,1.45vw,21px)] leading-normal font-medium text-pretty">
          Buy handmade work and commission pieces straight from the people who make them, or open a stall and sell
          your own. Every payment goes through PayPal, straight to the maker.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(240px,100%),1fr))] gap-3.5">
          <a
            href="#market"
            className="group flex min-h-[172px] flex-col justify-between gap-5 border-2 border-ink bg-paper p-[22px] text-ink no-underline motion-safe:transition-transform motion-safe:hover:-translate-y-1 hover:shadow-hard"
          >
            <span className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">I’m buying</span>
              <span className="stretch-80 text-[clamp(26px,2.1vw,32px)] leading-none font-extrabold">
                Find something made by hand
              </span>
            </span>
            <span className="inline-flex min-h-[46px] items-center self-start rounded-full bg-ink px-5 text-base font-bold text-paper group-hover:bg-indigo">
              Browse the market
            </span>
          </a>
          <a
            href="#studio"
            className="group flex min-h-[172px] flex-col justify-between gap-5 border-2 border-ink bg-ink p-[22px] text-paper no-underline motion-safe:transition-transform motion-safe:hover:-translate-y-1 hover:shadow-hard-indigo"
          >
            <span className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">I make things</span>
              <span className="stretch-80 text-[clamp(26px,2.1vw,32px)] leading-none font-extrabold">
                Open a stall, get paid with PayPal
              </span>
            </span>
            <span className="inline-flex min-h-[46px] items-center self-start rounded-full bg-raffia px-5 text-base font-bold text-ink group-hover:bg-paper">
              Start selling
            </span>
          </a>
        </div>
      </div>

      <div className="flex min-w-0 flex-[1_1_460px] items-center justify-center overflow-hidden border-2 border-ink bg-coral px-[clamp(20px,3.4vw,48px)] py-[clamp(28px,4vw,56px)]">
        {/* Taller on phones so the bottom card never covers the first card's caption. */}
        <div className="relative aspect-[1/1.46] w-full max-w-[500px] sm:aspect-[1/1.22]">
          <HeroCard piece={HERO_PIECES.pottery} aspect="aspect-[4/5]" className="top-0 left-0 w-1/2 -rotate-3" />
          <HeroCard
            piece={HERO_PIECES.weaving}
            aspect="aspect-[4/5]"
            tag="made-to-order"
            className="top-[14%] right-0 w-1/2 rotate-2"
          />
          <HeroCard
            piece={HERO_PIECES.wallBaskets}
            aspect="aspect-[5/4]"
            className="bottom-0 left-[4%] w-[48%] -rotate-1"
          />
          <div className="absolute right-[-1%] bottom-[6%] aspect-square w-[27%] -rotate-8">
            <PaidStamp />
          </div>
        </div>
      </div>
    </section>
  );
}

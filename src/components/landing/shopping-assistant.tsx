import Image from 'next/image';

import { ButtonLink } from '@/components/ui/button-link';

import { ASSISTANT_PICK } from './sample-listings';

/** Illustrates the shopping assistant (F11). The buyer always approves payment in PayPal. */
export function ShoppingAssistant() {
  return (
    <section
      id="assistant"
      aria-labelledby="assistant-heading"
      className="scroll-mt-4 border-t-2 border-ink bg-indigo-tint"
    >
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-[72px] gap-y-12 px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,104px)]">
        <div className="flex min-w-0 flex-[1_1_420px] flex-col gap-[22px]">
          <span className="text-[15px] font-bold">For buyers: the shopping assistant</span>
          <h2
            id="assistant-heading"
            className="stretch-75 text-[clamp(44px,6vw,88px)] leading-[0.9] font-extrabold tracking-[-0.02em]"
          >
            Buying a gift? Ask the market.
          </h2>
          <p className="max-w-[28em] text-[clamp(17px,1.35vw,19px)] leading-normal font-medium text-pretty">
            Tell the assistant who it’s for and what you have in mind. It searches real listings, explains its picks and
            gets a PayPal checkout ready. You approve every payment yourself.
          </p>
          <ButtonLink href="#assistant" size="lg">
            Ask the assistant
          </ButtonLink>
        </div>

        <div
          aria-label="Example conversation"
          role="group"
          className="flex min-w-0 flex-[1_1_460px] flex-col gap-3.5 border-2 border-ink bg-paper p-[clamp(16px,2.4vw,30px)] shadow-hard"
        >
          <p className="max-w-[82%] self-end rounded-[22px_22px_6px_22px] bg-ink px-[18px] py-3.5 text-[17px] leading-[1.4] font-medium text-paper">
            Beaded earrings for my sister’s birthday. Ready to ship, please.
          </p>
          <p className="max-w-[90%] self-start rounded-[22px_22px_22px_6px] border-2 border-ink bg-chat px-[18px] py-3.5 text-[17px] leading-[1.45]">
            These beaded drop earrings are made by hand by Funmi in Abeokuta, and they’re ready to ship. Shall I start a
            PayPal checkout? You’ll approve the payment yourself.
          </p>
          <div className="flex max-w-[90%] items-stretch border-2 border-ink">
            <div className="relative min-h-24 w-24 shrink-0 overflow-hidden border-r-2 border-ink">
              <Image
                src={ASSISTANT_PICK.image}
                alt={ASSISTANT_PICK.alt}
                fill
                placeholder="blur"
                sizes="96px"
                className="object-cover"
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1 px-3.5 py-3">
              <span className="stretch-80 text-xl leading-[1.05] font-extrabold">Beaded drop earrings</span>
              <span className="text-[15px]">Funmi, Abeokuta</span>
              <span className="text-[17px] font-extrabold">[PRICE] USD</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5" aria-hidden="true">
            <span className="inline-flex min-h-12 items-center rounded-full border border-raffia-deep bg-raffia px-[22px] text-base font-bold">
              Start checkout
            </span>
            <span className="inline-flex min-h-12 items-center rounded-full border border-line-strong bg-paper px-[22px] text-base font-bold">
              Show me more
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

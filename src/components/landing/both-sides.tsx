import { ButtonLink } from '@/components/ui/button-link';

const BUYER_POINTS = [
  'Every piece has a named maker and a hometown',
  'Commission beadwork, pottery and one-off pieces',
  'Pay with PayPal, and approve every payment yourself',
];

const MAKER_POINTS = [
  'List a piece with a photo and a few words, in Pidgin, English or your own language',
  'Take commissions with clear briefs, deposits and balances',
  'Get paid with PayPal into your own account, and withdraw in naira in Nigeria',
];

export function BothSides() {
  return (
    <section aria-labelledby="sides-heading" className="border-t-2 border-ink bg-coral-tint">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-[clamp(28px,4vw,48px)] px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,104px)]">
        <h2
          id="sides-heading"
          className="stretch-75 max-w-[12em] text-[clamp(44px,6vw,88px)] leading-[0.9] font-extrabold tracking-[-0.02em] text-balance"
        >
          Built for both sides of the stall
        </h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] gap-5">
          <div className="flex flex-col gap-6 border-2 border-ink bg-paper p-[clamp(24px,3vw,40px)]">
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">If you’re buying</span>
              <h3 className="stretch-80 text-[clamp(28px,2.6vw,38px)] leading-none font-extrabold">
                Know exactly who made it, and who you’re paying
              </h3>
            </div>
            <ul className="flex flex-col border-t-2 border-ink text-[17px] leading-[1.45]">
              {BUYER_POINTS.map((point) => (
                <li key={point} className="border-b border-ink py-3.5">
                  {point}
                </li>
              ))}
            </ul>
            <ButtonLink href="#market">Browse the market</ButtonLink>
          </div>
          <div className="on-ink flex flex-col gap-6 border-2 border-ink bg-ink p-[clamp(24px,3vw,40px)] text-paper">
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">If you make things</span>
              <h3 className="stretch-80 text-[clamp(28px,2.6vw,38px)] leading-none font-extrabold">
                Sell to buyers anywhere, without leaving your workshop
              </h3>
            </div>
            <ul className="flex flex-col border-t-2 border-paper text-[17px] leading-[1.45]">
              {MAKER_POINTS.map((point) => (
                <li key={point} className="border-b border-on-ink-line py-3.5">
                  {point}
                </li>
              ))}
            </ul>
            <ButtonLink href="#studio" variant="raffia">
              Start selling
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}

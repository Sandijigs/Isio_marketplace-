const FLOW = [
  { label: 'Request', paid: false },
  { label: 'Brief', paid: false },
  { label: 'Quote', paid: false },
  { label: 'Deposit with PayPal', paid: true },
  { label: 'Delivery', paid: false },
  { label: 'Balance with PayPal', paid: true },
];

/** Illustrates commissions (F10): an example brief the AI organises from a buyer's request. */
export function Commissions() {
  return (
    <section
      id="commissions"
      aria-labelledby="commissions-heading"
      className="mx-auto flex max-w-[1360px] scroll-mt-4 flex-wrap items-center gap-x-[72px] gap-y-12 px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,104px)]"
    >
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-6">
        <h2
          id="commissions-heading"
          className="stretch-75 text-[clamp(44px,6vw,88px)] leading-[0.9] font-extrabold tracking-[-0.02em] text-balance"
        >
          Commissions, without the back and forth
        </h2>
        <p className="max-w-[30em] text-[clamp(17px,1.35vw,19px)] leading-normal font-medium text-pretty">
          Buyers describe what they want in their own words. Isio turns it into a clear brief, the maker sends a quote,
          and the deposit and the balance are both paid with PayPal.
        </p>
        <ol aria-label="How a commission works" className="flex flex-wrap gap-2 text-[15px] font-bold">
          {FLOW.map((step) => (
            <li key={step.label} className={`rounded-full px-4 py-2 ${step.paid ? 'bg-raffia' : 'bg-indigo-tint'}`}>
              {step.label}
            </li>
          ))}
        </ol>
      </div>

      <article
        aria-label="Example brief"
        className="min-w-0 flex-[1_1_440px] border-2 border-ink bg-paper shadow-hard-indigo"
      >
        <div className="flex flex-wrap justify-between gap-3 border-b-2 border-ink bg-indigo px-[22px] py-3.5 text-[15px] font-semibold text-paper">
          <span>Brief for Ese</span>
          <span>Organised by Isio</span>
        </div>
        <div className="flex flex-col gap-[18px] p-[clamp(20px,2.4vw,32px)]">
          <h3 className="stretch-80 text-[clamp(26px,2.6vw,34px)] leading-[1.05] font-extrabold">
            Beaded neckline for a wedding outfit
          </h3>
          <dl className="grid grid-cols-[repeat(auto-fit,minmax(min(150px,100%),1fr))] gap-x-6 gap-y-3.5">
            <div>
              <dt className="text-sm font-semibold">From</dt>
              <dd className="mt-1 text-[17px]">A photo of the outfit</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold">Size</dt>
              <dd className="mt-1 text-[17px]">[SIZE]</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold">Needed by</dt>
              <dd className="mt-1 text-[17px]">[DATE]</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2.5 border-t-2 border-ink pt-4">
            <span className="text-sm font-semibold">Questions to ask the buyer</span>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-[17px] leading-normal">
              <li>Pearl, silver, or both?</li>
              <li>Will you send the fabric, or should Ese source it?</li>
              <li>Where should it ship?</li>
            </ul>
          </div>
          <span
            aria-hidden="true"
            className="inline-flex min-h-[50px] items-center self-start rounded-full bg-ink px-6 text-[17px] font-bold text-paper"
          >
            Send a quote
          </span>
        </div>
      </article>
    </section>
  );
}

const STEPS = [
  {
    title: 'The buyer pays with PayPal',
    body: 'Checkout the way buyers already pay online. Nothing is charged until they approve it.',
    colour: 'text-coral',
  },
  {
    title: 'The maker is paid directly',
    body: 'The money goes straight into the maker’s own PayPal account. Isio never holds it.',
    colour: 'text-raffia',
  },
  {
    title: 'Withdraw in naira',
    body: 'Makers in Nigeria can move their earnings to their bank account in naira.',
    colour: 'text-indigo-tint',
  },
];

export function MoneyMoves() {
  return (
    <section id="payments" aria-labelledby="payments-heading" className="on-ink scroll-mt-4 bg-ink text-paper">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-[clamp(32px,4vw,52px)] px-[clamp(16px,4vw,40px)] py-[clamp(56px,7vw,104px)]">
        <h2
          id="payments-heading"
          className="stretch-75 max-w-[10em] text-[clamp(44px,6vw,88px)] leading-[0.9] font-extrabold tracking-[-0.02em]"
        >
          How the money moves
        </h2>
        <ol className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-12 gap-y-9">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 border-t-2 border-paper pt-[22px]">
              <span
                aria-hidden="true"
                className={`stretch-75 text-[clamp(72px,7vw,104px)] leading-[0.8] font-extrabold ${step.colour}`}
              >
                {index + 1}
              </span>
              <span className="stretch-80 text-[clamp(26px,2.2vw,32px)] leading-[1.05] font-extrabold">
                {step.title}
              </span>
              <span className="text-[17px] leading-normal text-[#e2e2e2]">{step.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

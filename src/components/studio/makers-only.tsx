import { ButtonLink } from '@/components/ui/button-link';

/** What a signed-in buyer sees anywhere in the studio. */
export function MakersOnly({ name }: Readonly<{ name: string }>) {
  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col items-start gap-5">
      <h1 id="studio-heading" className="stretch-75 text-[clamp(44px,6vw,80px)] leading-[0.9] font-bold tracking-[-0.025em]">
        The studio is for makers.
      </h1>
      <p className="text-lg font-medium">
        You’re signed in as {name}, with a buyer account. Makers use the studio to set up their stall and list their
        work. To sell on Isio, sign out and create a maker account.
      </p>
      <ButtonLink href="/" size="lg">
        Back to the market
      </ButtonLink>
    </section>
  );
}

/** For studio pages that need a stall before anything else. */
export function SetUpStallFirst() {
  return (
    <section aria-labelledby="studio-heading" className="flex max-w-[640px] flex-col items-start gap-5">
      <h1 id="studio-heading" className="stretch-75 text-[clamp(44px,6vw,80px)] leading-[0.9] font-bold tracking-[-0.025em]">
        Set up your stall first.
      </h1>
      <p className="text-lg font-medium">Your pieces show under your stall’s name, so pick a handle before you list anything.</p>
      <ButtonLink href="/studio" size="lg">
        Set up your stall
      </ButtonLink>
    </section>
  );
}

/** The big studio page title, used on every studio page. */
export function StudioHeading({ title, intro }: Readonly<{ title: string; intro?: React.ReactNode }>) {
  return (
    <div className="flex flex-col gap-3">
      <h1 id="studio-heading" className="stretch-75 text-[clamp(44px,6vw,80px)] leading-[0.9] font-bold tracking-[-0.025em] break-words">
        {title}
      </h1>
      {intro ? <p className="text-lg font-medium">{intro}</p> : null}
    </div>
  );
}

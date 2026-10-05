import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { ButtonLink } from '@/components/ui/button-link';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-[1360px] flex-col gap-6 px-[clamp(16px,4vw,40px)] py-[clamp(64px,10vw,140px)]">
        <h1 className="stretch-75 max-w-[10em] text-[clamp(52px,7vw,104px)] leading-[0.9] font-bold tracking-[-0.025em]">
          This stall is empty.
        </h1>
        <p className="max-w-[32em] text-[clamp(18px,1.45vw,21px)] leading-normal font-medium">
          The page you’re looking for isn’t here, or hasn’t been built yet. Isio is being built in public.
        </p>
        <ButtonLink href="/" size="lg">
          Back to the market
        </ButtonLink>
      </main>
      <SiteFooter />
    </>
  );
}

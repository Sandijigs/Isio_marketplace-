import { SiteFooter } from './site-footer';
import { SiteHeader } from './site-header';

/** Header, a main area with the standard gutters, and the footer. */
export function PageFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1360px] px-[clamp(16px,4vw,40px)] pt-[clamp(28px,5vw,64px)] pb-[clamp(56px,8vw,112px)]">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SignUpForm } from '@/components/auth/sign-up-form';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { safeNextPath } from '@/lib/safe-redirect';
import { getSession } from '@/services/catalog/session';

export const metadata: Metadata = { title: 'Create an account · Isio' };

export default async function SignUpPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ next?: string; role?: string }> }>) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  if (await getSession()) redirect(nextPath);

  // "Start selling" lands here, so selling is the default; buyer links pass ?role=buyer.
  const initialRole = params.role === 'buyer' ? 'BUYER' : 'CREATIVE';

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,40px)] pt-[clamp(28px,5vw,64px)] pb-[clamp(56px,8vw,112px)]">
        <section aria-labelledby="signup-heading" className="flex max-w-[640px] flex-col gap-7">
          <div className="flex flex-col gap-3">
            <h1
              id="signup-heading"
              className="stretch-75 text-[clamp(48px,6vw,84px)] leading-[0.9] font-bold tracking-[-0.025em]"
            >
              Join Isio.
            </h1>
            <p className="text-lg font-medium">Sell your work, or buy straight from the people who make it.</p>
          </div>
          <SignUpForm initialRole={initialRole} nextPath={nextPath} />
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

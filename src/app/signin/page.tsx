import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { SignInScreen } from '@/components/auth/sign-in-screen';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';
import { modes } from '@/lib/env';
import { safeNextPath } from '@/lib/safe-redirect';
import { DEMO_ACCOUNTS, demoAccountsEnabled } from '@/services/catalog/demo-accounts';
import { ensureDemoData } from '@/services/catalog/demo-seed';
import { getSession } from '@/services/catalog/session';

export const metadata: Metadata = { title: 'Sign in · Isio' };

export default async function SignInPage({ searchParams }: Readonly<{ searchParams: Promise<{ next?: string }> }>) {
  const nextPath = safeNextPath((await searchParams).next);
  if (await getSession()) redirect(nextPath);

  const showDemo = demoAccountsEnabled();
  if (showDemo) await ensureDemoData();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-[1360px] px-[clamp(16px,4vw,40px)] pt-[clamp(28px,5vw,64px)] pb-[clamp(56px,8vw,112px)]">
        <SignInScreen
          nextPath={nextPath}
          demoAccounts={showDemo ? DEMO_ACCOUNTS : []}
          paymentsNote={
            modes.payments === 'mock'
              ? 'Payments here are simulated. No real money moves.'
              : 'Payments use PayPal’s sandbox with test money. No real money moves.'
          }
        />
      </main>
      <SiteFooter />
    </>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buttonClasses } from '@/components/ui/button-link';
import { TextField } from '@/components/ui/text-field';
import type { DemoAccount } from '@/types/shared';

import { FormError } from './form-error';
import { submitAuth } from './submit-auth';

/** The sign-in form plus, where Isio isn't taking live payments, one-tap demo accounts. */
export function SignInScreen({
  nextPath,
  demoAccounts,
  paymentsNote,
}: Readonly<{ nextPath: string; demoAccounts: readonly DemoAccount[]; paymentsNote: string | null }>) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null); // which button is working
  const [error, setError] = useState<string | null>(null);

  async function signIn(email: string, password: string, source: string) {
    setPending(source);
    setError(null);
    const result = await submitAuth('/api/auth/signin', { email, password });
    if (!result.ok) {
      setError(result.message);
      setPending(null);
      return;
    }
    // Makers start in their studio unless they were heading somewhere specific.
    router.replace(nextPath === '/' && result.data.user.role === 'CREATIVE' ? '/studio' : nextPath);
    router.refresh();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    void signIn(String(form.get('email') ?? ''), String(form.get('password') ?? ''), 'form');
  }

  return (
    <div className="grid items-start gap-[clamp(40px,5vw,72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-labelledby="signin-heading" className="flex max-w-[460px] flex-col gap-7">
        <div className="flex flex-col gap-3">
          <h1
            id="signin-heading"
            className="stretch-75 text-[clamp(48px,6vw,84px)] leading-[0.9] font-bold tracking-[-0.025em]"
          >
            Welcome back.
          </h1>
          <p className="text-lg font-medium">Sign in to buy, commission or run your stall.</p>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <FormError message={error} />
          <TextField
            id="signin-email"
            name="email"
            label="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
          />
          <TextField
            id="signin-password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
          />
          <button type="submit" disabled={pending !== null} className={`${buttonClasses('ink', 'lg')} w-full`}>
            {pending === 'form' ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-base font-medium">
          New to Isio?{' '}
          <Link href="/signup" className="font-bold text-ink underline underline-offset-4 hover:text-indigo">
            Create an account
          </Link>
        </p>
      </section>

      {demoAccounts.length > 0 ? (
        <section
          aria-labelledby="demo-heading"
          className="order-first flex flex-col gap-5 border-2 border-ink bg-indigo-tint p-[clamp(18px,3vw,32px)] lg:order-none"
        >
          <div className="flex flex-col gap-2">
            <h2 id="demo-heading" className="stretch-80 text-[clamp(26px,3vw,34px)] leading-none font-extrabold">
              Try Isio with a demo account
            </h2>
            <p className="text-base font-medium">
              Shared accounts for exploring both sides. {paymentsNote}
            </p>
          </div>

          <ul className="flex flex-col gap-3">
            {demoAccounts.map((account) => (
              <li
                key={account.email}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-2 border-ink bg-paper p-4"
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="stretch-80 text-xl leading-none font-extrabold">{account.name}</span>
                    <span
                      className={`inline-flex min-h-7 items-center rounded-full border px-3 text-sm font-bold ${
                        account.role === 'CREATIVE'
                          ? 'border-raffia-deep bg-raffia text-ink'
                          : 'border-ink bg-ink text-paper'
                      }`}
                    >
                      {account.role === 'CREATIVE' ? 'Creative' : 'Buyer'}
                    </span>
                  </div>
                  <span className="text-[15px] font-medium">{account.description}</span>
                  <span className="text-[15px] font-medium break-all text-ink/75">{account.email}</span>
                </div>
                <button
                  type="button"
                  disabled={pending !== null}
                  onClick={() => void signIn(account.email, account.password, account.email)}
                  className={`${buttonClasses('ink')} w-full sm:w-auto`}
                >
                  {pending === account.email ? 'Signing in…' : `Sign in as ${account.name}`}
                </button>
              </li>
            ))}
          </ul>

          <p className="text-[15px] font-medium">
            Every demo account uses the password{' '}
            <code className="bg-paper px-1.5 py-0.5 font-sans font-bold">{demoAccounts[0]?.password}</code>, if you’d
            rather type it in.
          </p>
        </section>
      ) : null}
    </div>
  );
}

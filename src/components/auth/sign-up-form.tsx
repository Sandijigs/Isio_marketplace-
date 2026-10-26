'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { buttonClasses } from '@/components/ui/button-link';
import { TextField } from '@/components/ui/text-field';
import type { UserRole } from '@/types/shared';

import { FormError } from './form-error';
import { submitAuth } from './submit-auth';

const ROLES: ReadonlyArray<{ value: UserRole; title: string; detail: string }> = [
  { value: 'CREATIVE', title: 'I make things to sell', detail: 'Open a stall, list your work and get paid with PayPal.' },
  { value: 'BUYER', title: 'I want to buy', detail: 'Buy pieces and commission work straight from the makers.' },
];

export function SignUpForm({ initialRole, nextPath }: Readonly<{ initialRole: UserRole; nextPath: string }>) {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>(initialRole);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const result = await submitAuth('/api/auth/signup', {
      name: String(form.get('name') ?? ''),
      email: String(form.get('email') ?? ''),
      password: String(form.get('password') ?? ''),
      role,
    });
    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }
    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <FormError message={error} />

      <fieldset className="flex flex-col gap-3">
        <legend className="pb-3 text-[17px] font-bold">What brings you to Isio?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLES.map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 border-2 border-ink p-4 transition-colors has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-3 has-[:focus-visible]:outline-indigo ${
                role === option.value ? 'bg-raffia-tint shadow-hard' : 'bg-paper hover:bg-raffia-tint/50'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="mt-1 size-5 shrink-0 accent-ink"
              />
              <span className="flex flex-col gap-1">
                <span className="text-[17px] font-bold">{option.title}</span>
                <span className="text-[15px] font-medium">{option.detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextField
        id="signup-name"
        name="name"
        label="Your name"
        hint={role === 'CREATIVE' ? 'Buyers see this on your stall. You can change it later.' : undefined}
        autoComplete="name"
        maxLength={80}
        required
      />
      <TextField
        id="signup-email"
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
        id="signup-password"
        name="password"
        label="Password"
        hint="At least 8 characters."
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />

      <button type="submit" disabled={pending} className={`${buttonClasses('ink', 'lg')} w-full`}>
        {pending ? 'Creating your account…' : 'Create account'}
      </button>

      <p className="text-base font-medium">
        Already on Isio?{' '}
        <Link
          href={nextPath === '/' ? '/signin' : `/signin?next=${encodeURIComponent(nextPath)}`}
          className="font-bold text-ink underline underline-offset-4 hover:text-indigo"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { FormError } from '@/components/auth/form-error';
import { buttonClasses } from '@/components/ui/button-link';
import { TextArea } from '@/components/ui/text-area';
import { TextField } from '@/components/ui/text-field';
import { handleSchema, HANDLE_MAX, profileInput } from '@/services/catalog/profile-input';
import type { ApiErrorBody, CreativeProfile, MyProfileResponse } from '@/types/shared';

type Field = 'displayName' | 'handle' | 'craft' | 'location' | 'story' | 'paypalEmail';
type Values = Record<Field, string>;
type HandleState = 'idle' | 'checking' | 'available' | 'taken' | 'unknown';

const FIELD_ORDER: readonly Field[] = ['displayName', 'handle', 'craft', 'location', 'story', 'paypalEmail'];
const fieldId = (field: Field) => `profile-${field}`;

function initialValues(profile: CreativeProfile | null, fallbackName: string): Values {
  return {
    displayName: profile?.displayName ?? fallbackName,
    handle: profile?.handle ?? '',
    craft: profile?.craft ?? '',
    location: profile?.location ?? '',
    story: profile?.story ?? '',
    paypalEmail: profile?.paypalEmail ?? '',
  };
}

function isApiError(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'error' in body;
}

export function ProfileForm({
  profile,
  fallbackName,
  siteHost,
}: Readonly<{ profile: CreativeProfile | null; fallbackName: string; siteHost: string }>) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(() => initialValues(profile, fallbackName));
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedHandle, setSavedHandle] = useState<string | null>(profile?.handle ?? null);
  const [justSaved, setJustSaved] = useState(false);
  const [handleTouched, setHandleTouched] = useState(false);
  // The latest availability answer, tagged with the handle it was for, so a slow reply never labels a newer handle.
  const [lookup, setLookup] = useState<{ handle: string; state: 'available' | 'taken' | 'unknown' } | null>(null);
  const savedNotice = useRef<HTMLParagraphElement>(null);

  const handle = values.handle.trim();
  const handleCheck = handleSchema.safeParse(handle);
  const handleFormatError = handleTouched && handle !== '' && !handleCheck.success ? handleCheck.error.issues[0]?.message : undefined;
  const candidate = handleCheck.success && handleCheck.data !== savedHandle ? handleCheck.data : null;
  const handleState: HandleState = !candidate ? 'idle' : lookup?.handle === candidate ? lookup.state : 'checking';

  // Check availability as they type, after a pause, using the public storefront lookup.
  useEffect(() => {
    if (!candidate) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/creatives/${encodeURIComponent(candidate)}`, { signal: controller.signal })
        .then((res) => setLookup({ handle: candidate, state: res.status === 404 ? 'available' : res.ok ? 'taken' : 'unknown' }))
        .catch(() => {
          if (!controller.signal.aborted) setLookup({ handle: candidate, state: 'unknown' });
        });
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [candidate]);

  function update(field: Field, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setJustSaved(false);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setJustSaved(false);
    setHandleTouched(true);

    const parsed = profileInput.safeParse(values);
    const fieldErrors: Partial<Record<Field, string>> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field | undefined;
        if (field && !fieldErrors[field]) fieldErrors[field] = issue.message;
      }
    }
    if (handleState === 'taken') fieldErrors.handle = `@${handle} is taken. Try another handle.`;
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      const first = FIELD_ORDER.find((f) => fieldErrors[f]);
      if (first) document.getElementById(fieldId(first))?.focus();
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/creatives/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const body: unknown = await res.json().catch(() => null);
      if (res.ok) {
        const saved = (body as MyProfileResponse).creativeProfile;
        setValues(initialValues(saved, fallbackName));
        setSavedHandle(saved.handle);
        setJustSaved(true);
        router.refresh();
        requestAnimationFrame(() => savedNotice.current?.focus());
      } else if (isApiError(body) && body.error.code === 'CONFLICT') {
        setLookup({ handle, state: 'taken' });
        setErrors({ handle: body.error.message });
        document.getElementById(fieldId('handle'))?.focus();
      } else {
        setFormError(isApiError(body) ? body.error.message : 'Couldn’t save your profile. Try again.');
      }
    } catch {
      setFormError('Couldn’t reach Isio. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  }

  const shownHandle = handleCheck.success ? handleCheck.data : handle.toLowerCase() || 'yourname';
  const handleError =
    errors.handle ?? handleFormatError ?? (handleState === 'taken' ? `@${shownHandle} is taken. Try another handle.` : undefined);
  const handleHint = (
    <>
      Your stall’s address:{' '}
      <span className="font-bold break-all text-ink">
        {siteHost}/@{shownHandle}
      </span>
      {handleState === 'checking' ? ' (checking…)' : handleState === 'available' ? ' is free.' : null}
    </>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <FormError message={formError} />

      <TextField
        id={fieldId('displayName')}
        label="Your name on Isio"
        hint="Buyers see this on your stall."
        autoComplete="name"
        maxLength={80}
        value={values.displayName}
        error={errors.displayName}
        onChange={(e) => update('displayName', e.target.value)}
        required
      />
      <TextField
        id={fieldId('handle')}
        label="Handle"
        hint={handleHint}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        maxLength={HANDLE_MAX}
        placeholder="yourname"
        value={values.handle}
        error={handleError}
        onChange={(e) => update('handle', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
        onBlur={() => setHandleTouched(true)}
        required
      />
      <TextField
        id={fieldId('craft')}
        label="What you make"
        hint="A few words, like “Beadwork” or “Adire textiles”."
        maxLength={60}
        value={values.craft}
        error={errors.craft}
        onChange={(e) => update('craft', e.target.value)}
        required
      />
      <TextField
        id={fieldId('location')}
        label="Where you work (optional)"
        hint="Town and state, like “Warri, Delta State”."
        autoComplete="address-level2"
        maxLength={80}
        value={values.location}
        error={errors.location}
        onChange={(e) => update('location', e.target.value)}
      />
      <TextArea
        id={fieldId('story')}
        label="Your story (optional)"
        hint="In your own words: what you make, how, and who it’s for."
        maxLength={2000}
        value={values.story}
        error={errors.story}
        onChange={(e) => update('story', e.target.value)}
      />
      <TextField
        id={fieldId('paypalEmail')}
        label="PayPal email (optional for now)"
        hint="Buyers pay this PayPal account directly; Isio never holds your money. It is never shown on your stall. You’ll need it before you can sell a piece."
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="none"
        spellCheck={false}
        value={values.paypalEmail}
        error={errors.paypalEmail}
        onChange={(e) => update('paypalEmail', e.target.value)}
      />

      <div className="flex flex-col gap-4">
        <button type="submit" disabled={saving} className={`${buttonClasses('ink', 'lg')} w-full sm:w-auto sm:self-start`}>
          {saving ? 'Saving…' : 'Save profile'}
        </button>
        <div role="status" aria-live="polite">
          {justSaved && savedHandle ? (
            <p
              ref={savedNotice}
              tabIndex={-1}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-2 border-ink bg-raffia-tint px-4 py-3 text-base font-semibold"
            >
              <span>Profile saved.</span>
              <Link href={`/@${savedHandle}`} className="font-bold text-ink underline underline-offset-4 hover:text-indigo">
                View your stall
              </Link>
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );
}

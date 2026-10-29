import type { InputHTMLAttributes } from 'react';

import { FieldError, FieldLabel, fieldBorder, fieldDescribedBy } from './field-parts';

/** A labelled input. 17px text so phones don't zoom in on focus. */
export function TextField({
  label,
  hint,
  error,
  id,
  ...input
}: Readonly<{ label: string; hint?: React.ReactNode; error?: string | null; id: string } & InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} label={label} hint={hint} />
      <input
        id={id}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={`min-h-[52px] w-full min-w-0 border-2 ${fieldBorder(error)} bg-paper px-4 text-[17px] font-medium placeholder:text-ink/45`}
        {...input}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

import type { TextareaHTMLAttributes } from 'react';

import { FieldError, FieldLabel, fieldBorder, fieldDescribedBy } from './field-parts';

/** A labelled multi-line input, matching TextField. */
export function TextArea({
  label,
  hint,
  error,
  id,
  ...textarea
}: Readonly<{ label: string; hint?: React.ReactNode; error?: string | null; id: string } & TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} label={label} hint={hint} />
      <textarea
        id={id}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={`min-h-[160px] w-full min-w-0 resize-y border-2 ${fieldBorder(error)} bg-paper px-4 py-3 text-[17px] leading-normal font-medium placeholder:text-ink/45`}
        {...textarea}
      />
      <FieldError id={id} error={error} />
    </div>
  );
}

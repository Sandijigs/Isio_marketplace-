import type { SelectHTMLAttributes } from 'react';

import { FieldError, FieldLabel, fieldBorder, fieldDescribedBy } from './field-parts';

/** A labelled native select, matching TextField. Native so phones show their own picker. */
export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...select
}: Readonly<
  { label: string; hint?: React.ReactNode; error?: string | null; id: string; children: React.ReactNode } & SelectHTMLAttributes<HTMLSelectElement>
>) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} label={label} hint={hint} />
      <select
        id={id}
        aria-describedby={fieldDescribedBy(id, hint, error)}
        aria-invalid={error ? true : undefined}
        className={`min-h-[52px] w-full min-w-0 cursor-pointer border-2 ${fieldBorder(error)} bg-paper px-4 text-[17px] font-medium`}
        {...select}
      >
        {children}
      </select>
      <FieldError id={id} error={error} />
    </div>
  );
}

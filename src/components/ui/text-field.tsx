import type { InputHTMLAttributes } from 'react';

/** A labelled input. 17px text so phones don't zoom in on focus. */
export function TextField({
  label,
  hint,
  id,
  ...input
}: Readonly<{ label: string; hint?: string; id: string } & InputHTMLAttributes<HTMLInputElement>>) {
  const hintId = hint ? `${id}-hint` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[17px] font-bold">
        {label}
      </label>
      {hint ? (
        <span id={hintId} className="text-[15px] font-medium text-ink/75">
          {hint}
        </span>
      ) : null}
      <input
        id={id}
        aria-describedby={hintId}
        className="min-h-[52px] w-full min-w-0 border-2 border-ink bg-paper px-4 text-[17px] font-medium placeholder:text-ink/45"
        {...input}
      />
    </div>
  );
}

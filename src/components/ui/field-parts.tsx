/** Label, hint and error ids shared by TextField and TextArea, so both read the same to screen readers. */
export function fieldDescribedBy(id: string, hint?: React.ReactNode, error?: string | null): string | undefined {
  return [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;
}

export function FieldLabel({ id, label, hint }: Readonly<{ id: string; label: string; hint?: React.ReactNode }>) {
  return (
    <>
      <label htmlFor={id} className="text-[17px] font-bold">
        {label}
      </label>
      {hint ? (
        <span id={`${id}-hint`} className="text-[15px] font-medium text-ink/75">
          {hint}
        </span>
      ) : null}
    </>
  );
}

export function FieldError({ id, error }: Readonly<{ id: string; error?: string | null }>) {
  if (!error) return null;
  return (
    <span id={`${id}-error`} className="border-l-4 border-coral pl-3 text-[15px] font-semibold text-ink">
      {error}
    </span>
  );
}

/** Borders turn coral on error; colour is never the only signal (the message sits below). */
export function fieldBorder(error?: string | null): string {
  return error ? 'border-coral' : 'border-ink';
}

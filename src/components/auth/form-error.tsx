/** The one error message for a form, announced to screen readers. */
export function FormError({ message }: Readonly<{ message: string | null }>) {
  return (
    <div role="alert" aria-live="assertive">
      {message ? (
        <p className="border-2 border-coral bg-coral-tint px-4 py-3 text-base font-semibold text-ink">{message}</p>
      ) : null}
    </div>
  );
}

/** A grey block shaped like the content it stands in for. Pulses only if motion is welcome. */
export function Skeleton({ className = '' }: Readonly<{ className?: string }>) {
  return <div aria-hidden="true" className={`bg-line motion-safe:animate-pulse ${className}`} />;
}

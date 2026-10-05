import Link from 'next/link';

/** The Isio mark: three stars joined into a small constellation. "Isio" means stars in Urhobo. */
export function IsioMark({
  className,
  centre = '#ffffff',
}: Readonly<{ className?: string; centre?: string }>) {
  return (
    <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true" className={className}>
      <path d="M6 23 L16 8 L26 18" />
      <circle cx="6" cy="23" r="3" fill="currentColor" />
      <circle cx="16" cy="8" r="4" fill={centre} />
      <circle cx="26" cy="18" r="3" fill="currentColor" />
    </svg>
  );
}

export function IsioLogo() {
  return (
    <Link href="/" aria-label="Isio home" className="flex items-center gap-2.5 text-ink no-underline">
      <span className="flex size-[38px] items-center justify-center rounded-full border-2 border-ink bg-coral">
        <IsioMark className="size-[22px] text-ink" />
      </span>
      <span className="stretch-75 text-[clamp(30px,2.6vw,36px)] leading-none font-extrabold tracking-[-0.02em]">isio</span>
    </Link>
  );
}

import Link from 'next/link';

const VARIANTS = {
  ink: 'bg-ink text-paper hover:bg-indigo',
  raffia: 'bg-raffia text-ink hover:bg-paper',
  outline: 'border border-line-strong text-ink hover:border-ink',
  'outline-light': 'border border-on-ink-muted text-paper hover:bg-paper hover:text-ink',
} as const;

const SIZES = {
  md: 'min-h-[50px] px-6 text-[17px]',
  lg: 'min-h-[56px] px-[30px] text-lg',
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/** Isio's pill button, as a link. Never use it to imitate the PayPal button. */
export function ButtonLink({
  href,
  variant = 'ink',
  size = 'md',
  className = '',
  children,
}: Readonly<{
  href: string;
  variant?: ButtonVariant;
  size?: keyof typeof SIZES;
  className?: string;
  children: React.ReactNode;
}>) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center self-start rounded-full font-bold whitespace-nowrap no-underline transition-colors ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

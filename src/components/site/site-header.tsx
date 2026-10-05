import Link from 'next/link';

import { IsioLogo } from './isio-mark';

// Landing-page shortcuts for now; point them at /explore filters once browse (F5) exists.
const SHORTCUTS = [
  { label: 'Shop all', href: '/#market' },
  { label: 'Beadwork', href: '/#market' },
  { label: 'Pottery', href: '/#market' },
  { label: 'Weaving', href: '/#market' },
  { label: 'Carving', href: '/#market' },
  { label: 'Leather', href: '/#market' },
  { label: 'Commissions', href: '/#commissions' },
  { label: 'Ask the assistant', href: '/#assistant' },
];

/** The nav bar (logo, sign in, start selling) with the shortcut pills in a row below it. */
export function SiteHeader() {
  return (
    <>
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex min-h-[72px] max-w-[1360px] items-center justify-between gap-4 px-[clamp(16px,4vw,40px)]">
          <IsioLogo />
          <div className="flex shrink-0 items-center gap-[clamp(14px,2vw,24px)]">
            <Link href="/signin" className="py-3 text-base font-semibold text-ink no-underline hover:underline">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex min-h-[46px] items-center rounded-full bg-ink px-5 text-base font-bold whitespace-nowrap text-paper no-underline hover:bg-indigo"
            >
              Start selling
            </Link>
          </div>
        </div>
      </header>

      <nav aria-label="Shop" className="bg-paper">
        <ul className="no-scrollbar mx-auto flex max-w-[1360px] gap-2 overflow-x-auto px-[clamp(16px,4vw,40px)] py-3">
          {SHORTCUTS.map((item, index) => (
            <li key={item.label} className="shrink-0">
              <Link
                href={item.href}
                className={`inline-flex min-h-11 items-center rounded-full border px-4 text-[15px] font-semibold whitespace-nowrap no-underline transition-colors ${
                  index === 0
                    ? 'border-ink bg-ink text-paper hover:bg-indigo'
                    : 'border-line-strong bg-paper text-ink hover:border-ink'
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

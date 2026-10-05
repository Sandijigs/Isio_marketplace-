import Link from 'next/link';

import { ButtonLink } from '@/components/ui/button-link';

const COLUMNS = [
  {
    title: 'Buy',
    links: [
      { label: 'Browse the market', href: '/#market' },
      { label: 'Commissions', href: '/#commissions' },
      { label: 'Shopping assistant', href: '/#assistant' },
    ],
  },
  {
    title: 'Sell',
    links: [
      { label: 'Start selling', href: '/#studio' },
      { label: 'Listing studio', href: '/#studio' },
      { label: 'Getting paid', href: '/#payments' },
    ],
  },
  {
    title: 'Isio',
    links: [
      { label: 'Source code', href: 'https://github.com/Sandijigs/Isio_marketplace-' },
      { label: 'Run it yourself', href: 'https://github.com/Sandijigs/Isio_marketplace-#run-it-locally' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="on-ink bg-ink text-paper">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-12 px-[clamp(16px,4vw,40px)] pt-[clamp(56px,6vw,88px)] pb-8">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="flex flex-col gap-3">
            <span className="stretch-75 text-[clamp(110px,15vw,220px)] leading-[0.78] font-extrabold tracking-[-0.04em] text-raffia">
              isio
            </span>
            <span className="text-lg font-medium">Isio means “stars” in Urhobo.</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/#market" variant="outline-light">
              Browse the market
            </ButtonLink>
            <ButtonLink href="/#studio" variant="raffia">
              Start selling
            </ButtonLink>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-14 gap-y-7 border-t-2 border-[#3a3a3a] pt-7 text-[17px] font-semibold">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col">
              <span className="pb-1 text-sm font-medium text-on-ink-muted">{column.title}</span>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="py-2.5 text-paper no-underline hover:underline">
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-3 text-[15px] text-on-ink-muted">
          <span>© 2026 Isio</span>
          <span>Built for the PayPal AI Hackathon</span>
        </div>
      </div>
    </footer>
  );
}

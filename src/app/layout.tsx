import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';

import './globals.css';

// Bricolage Grotesque (SIL Open Font License, see ./fonts/OFL.txt), self-hosted so
// builds work offline. Variable weight 200–800 and width 75–100%.
const bricolage = localFont({
  src: './fonts/bricolage-grotesque-latin.woff2',
  variable: '--font-bricolage',
  weight: '200 800',
  style: 'normal',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 100%' }],
});

export const metadata: Metadata = {
  title: 'Isio: Africa’s makers, the world’s market',
  description:
    'Buy handmade work and commission pieces straight from African makers, or open a stall and sell your own. Every payment goes through PayPal, straight to the maker.',
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={bricolage.variable}>
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}

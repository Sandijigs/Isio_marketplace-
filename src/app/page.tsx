import { BothSides } from '@/components/landing/both-sides';
import { Commissions } from '@/components/landing/commissions';
import { Hero } from '@/components/landing/hero';
import { ListingStudio } from '@/components/landing/listing-studio';
import { MoneyMoves } from '@/components/landing/money-moves';
import { ShoppingAssistant } from '@/components/landing/shopping-assistant';
import { Stalls } from '@/components/landing/stalls';
import { SiteFooter } from '@/components/site/site-footer';
import { SiteHeader } from '@/components/site/site-header';

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <Stalls />
        <BothSides />
        <ListingStudio />
        <MoneyMoves />
        <Commissions />
        <ShoppingAssistant />
      </main>
      <SiteFooter />
    </>
  );
}

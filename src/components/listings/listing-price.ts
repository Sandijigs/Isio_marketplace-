import type { Availability } from '@/components/landing/stall-filter';
import { formatMoney } from '@/lib/money';
import type { Listing } from '@/types/shared';

/** How a buyer can get it: a service is a commission, a product with no stock count is made to order. */
export function availabilityOf(listing: Pick<Listing, 'kind' | 'stock'>): Availability {
  if (listing.kind === 'SERVICE') return 'commission';
  return listing.stock === null ? 'made-to-order' : 'ready';
}

/** "$45.00", or "From $60.00" for a service (its price is where quotes start). */
export function priceLabel(listing: Pick<Listing, 'kind' | 'price'>): string {
  return listing.kind === 'SERVICE' ? `From ${formatMoney(listing.price)}` : formatMoney(listing.price);
}

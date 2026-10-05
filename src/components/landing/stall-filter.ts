/** How a piece can be bought. Shared by the landing stalls and (later) real listing cards. */
export type Availability = 'ready' | 'commission' | 'made-to-order';

export type StallFilter = 'all' | Availability;

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  ready: 'Ready to ship',
  commission: 'Commission',
  'made-to-order': 'Made to order',
};

export const STALL_FILTERS: readonly { value: StallFilter; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'ready', label: 'Ready to ship' },
  { value: 'commission', label: 'Commissions' },
  { value: 'made-to-order', label: 'Made to order' },
];

export function filterByAvailability<T extends { availability: Availability }>(
  items: readonly T[],
  filter: StallFilter,
): T[] {
  return filter === 'all' ? [...items] : items.filter((item) => item.availability === filter);
}

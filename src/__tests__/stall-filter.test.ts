import { describe, expect, it } from 'vitest';

import { filterByAvailability, STALL_FILTERS, type Availability } from '@/components/landing/stall-filter';

const pieces: { id: string; availability: Availability }[] = [
  { id: 'a', availability: 'ready' },
  { id: 'b', availability: 'commission' },
  { id: 'c', availability: 'made-to-order' },
  { id: 'd', availability: 'ready' },
];

describe('filterByAvailability', () => {
  it('returns every piece for "all", as a new array', () => {
    const result = filterByAvailability(pieces, 'all');
    expect(result.map((p) => p.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(result).not.toBe(pieces);
  });

  it('keeps only the matching availability, in order', () => {
    expect(filterByAvailability(pieces, 'ready').map((p) => p.id)).toEqual(['a', 'd']);
    expect(filterByAvailability(pieces, 'commission').map((p) => p.id)).toEqual(['b']);
  });

  it('offers a filter for every availability plus "all"', () => {
    expect(STALL_FILTERS.map((f) => f.value)).toEqual(['all', 'ready', 'commission', 'made-to-order']);
  });
});

import { describe, expect, it } from 'vitest';

import { canMoveTo, listGaps, type PublishCandidate, publishGaps } from '@/services/catalog/listing-input';

const ready: PublishCandidate = {
  kind: 'PRODUCT',
  title: 'Beaded drop earrings',
  description: 'Light earrings.',
  category: 'jewelry',
  priceCents: 2800,
  turnaroundDays: null,
  images: [{ url: '/uploads/demo-earrings.jpg', alt: '' }],
};

describe('publishGaps', () => {
  it('is empty for a complete listing', () => {
    expect(publishGaps(ready, true)).toEqual([]);
  });

  it('names every missing requirement, in form order', () => {
    const gaps = publishGaps(
      { kind: 'SERVICE', title: ' ', description: '', category: null, priceCents: 0, turnaroundDays: null, images: [] },
      false,
    );
    expect(gaps.map((g) => g.field)).toEqual([
      'images',
      'title',
      'description',
      'category',
      'priceCents',
      'turnaroundDays',
      'paypalEmail',
    ]);
  });

  it('only asks a service for a turnaround', () => {
    expect(publishGaps({ ...ready, kind: 'SERVICE' }, true).map((g) => g.field)).toEqual(['turnaroundDays']);
    expect(publishGaps({ ...ready, kind: 'SERVICE', turnaroundDays: 14 }, true)).toEqual([]);
  });
});

describe('listGaps', () => {
  it('reads as a sentence', () => {
    expect(listGaps([{ field: 'title', label: 'a title' }])).toBe('a title');
    expect(
      listGaps([
        { field: 'title', label: 'a title' },
        { field: 'category', label: 'a category' },
        { field: 'images', label: 'a photo' },
      ]),
    ).toBe('a title, a category and a photo');
  });
});

describe('canMoveTo', () => {
  it('follows DRAFT → ACTIVE ↔ SOLD_OUT, any → ARCHIVED', () => {
    expect(canMoveTo('DRAFT', 'ACTIVE')).toBe(true);
    expect(canMoveTo('ACTIVE', 'SOLD_OUT')).toBe(true);
    expect(canMoveTo('SOLD_OUT', 'ACTIVE')).toBe(true);
    for (const from of ['DRAFT', 'ACTIVE', 'SOLD_OUT'] as const) expect(canMoveTo(from, 'ARCHIVED')).toBe(true);

    expect(canMoveTo('DRAFT', 'SOLD_OUT')).toBe(false);
    expect(canMoveTo('ACTIVE', 'DRAFT')).toBe(false);
    expect(canMoveTo('ARCHIVED', 'ACTIVE')).toBe(false);
    expect(canMoveTo('ARCHIVED', 'DRAFT')).toBe(false);
  });
});

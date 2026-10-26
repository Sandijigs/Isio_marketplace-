import { describe, expect, it } from 'vitest';

import { safeNextPath } from '@/lib/safe-redirect';

describe('safeNextPath', () => {
  it('keeps paths on this site', () => {
    expect(safeNextPath('/studio')).toBe('/studio');
    expect(safeNextPath('/l/abc?ref=home')).toBe('/l/abc?ref=home');
  });

  it('falls back for anything that could leave the site', () => {
    for (const value of ['https://evil.example', '//evil.example', '/\\evil.example', 'studio', '', undefined, 42]) {
      expect(safeNextPath(value)).toBe('/');
    }
  });
});

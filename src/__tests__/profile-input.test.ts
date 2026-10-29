import { describe, expect, it } from 'vitest';

import { handleSchema, profileInput, RESERVED_HANDLES } from '@/services/catalog/profile-input';

const valid = { handle: 'ese', displayName: 'Ese', craft: 'Beadwork' };

describe('handle rules', () => {
  it('accepts lowercase letters, digits and hyphens, 3 to 30 characters', () => {
    for (const h of ['ese', 'ese-beads', 'kemi2', 'a1b', 'x'.repeat(30)]) {
      expect(handleSchema.safeParse(h).success, h).toBe(true);
    }
  });

  it('normalises case and surrounding spaces', () => {
    expect(handleSchema.parse('  Ese-Beads ')).toBe('ese-beads');
  });

  it('rejects handles that are too short or too long', () => {
    expect(handleSchema.safeParse('es').success).toBe(false);
    expect(handleSchema.safeParse('x'.repeat(31)).success).toBe(false);
  });

  it('rejects anything but letters, digits and hyphens', () => {
    for (const h of ['ese beads', 'ese_beads', 'ese.beads', 'èse', 'ese@x', 'ese/../admin']) {
      expect(handleSchema.safeParse(h).success, h).toBe(false);
    }
  });

  it('rejects hyphens at the start or end', () => {
    expect(handleSchema.safeParse('-ese').success).toBe(false);
    expect(handleSchema.safeParse('ese-').success).toBe(false);
  });

  it('rejects every reserved word, in any case', () => {
    for (const word of ['studio', 'signin', 'signup', 'api', 'explore', 'admin', 'assistant']) {
      expect(RESERVED_HANDLES.has(word), word).toBe(true);
    }
    for (const word of RESERVED_HANDLES) {
      const result = handleSchema.safeParse(word.toUpperCase());
      expect(result.success, word).toBe(false);
      expect(result.error?.issues[0]?.message).toMatch(/reserved/);
    }
  });
});

describe('profile input', () => {
  it('stores blank optional fields as null', () => {
    expect(profileInput.parse({ ...valid, location: '  ', story: '', paypalEmail: '' })).toMatchObject({
      location: null,
      story: null,
      paypalEmail: null,
    });
  });

  it('requires a valid PayPal email when one is given, and lowercases it', () => {
    expect(profileInput.safeParse({ ...valid, paypalEmail: 'not-an-email' }).success).toBe(false);
    expect(profileInput.parse({ ...valid, paypalEmail: ' Ese.Shop@Example.com ' }).paypalEmail).toBe('ese.shop@example.com');
  });

  it('requires a name and a craft', () => {
    expect(profileInput.safeParse({ ...valid, displayName: '  ' }).success).toBe(false);
    expect(profileInput.safeParse({ ...valid, craft: '' }).success).toBe(false);
  });

  it('ignores fields it does not know, like a user id', () => {
    expect(profileInput.parse({ ...valid, userId: 'someone-else' })).not.toHaveProperty('userId');
  });
});

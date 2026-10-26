import { describe, expect, it } from 'vitest';

import { BCRYPT_COST, hashPassword, verifyPassword } from '@/services/catalog/password';

describe('password hashing', () => {
  it('hashes with bcrypt at cost 12 and never stores the password', async () => {
    const hash = await hashPassword('coral-beads-42');
    expect(BCRYPT_COST).toBe(12);
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    expect(hash).not.toContain('coral-beads-42');
  });

  it('salts every hash', async () => {
    const [a, b] = await Promise.all([hashPassword('same-password'), hashPassword('same-password')]);
    expect(a).not.toBe(b);
  });

  it('accepts the right password and rejects others', async () => {
    const hash = await hashPassword('coral-beads-42');
    expect(await verifyPassword('coral-beads-42', hash)).toBe(true);
    expect(await verifyPassword('coral-beads-43', hash)).toBe(false);
    expect(await verifyPassword('', hash)).toBe(false);
  });

  it('rejects any password when there is no account', async () => {
    expect(await verifyPassword('anything', null)).toBe(false);
  });
});

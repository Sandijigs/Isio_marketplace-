import bcrypt from 'bcryptjs';

/** Cost 12: about a quarter second per hash, slow enough to resist guessing. */
export const BCRYPT_COST = 12;

/**
 * A real cost-12 hash of a random string nobody knows. Comparing against it
 * when an email has no account keeps sign-in timing the same either way, so
 * response time doesn't reveal who has an account.
 */
const UNKNOWN_ACCOUNT_HASH = '$2b$12$rFG5OmHgt5Y0J.UezqDNq.oHeAOUR31iVDT0Q2d/apvrINxvnAG2m';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_COST);
}

export function verifyPassword(password: string, hash: string | null): Promise<boolean> {
  if (!hash) return bcrypt.compare(password, UNKNOWN_ACCOUNT_HASH).then(() => false);
  return bcrypt.compare(password, hash);
}

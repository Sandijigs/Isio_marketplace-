import { z } from 'zod';

/**
 * Sign-up and sign-in input, validated at the API boundary. Kept free of
 * server imports so forms could share it. Messages are shown to people as is.
 */

const email = z
  .string({ error: 'Enter your email address.' })
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: 'Enter a valid email address, like name@example.com.' }));

// bcrypt only reads the first 72 bytes; longer passwords would silently share a hash.
const newPassword = z
  .string({ error: 'Choose a password.' })
  .min(8, { error: 'Use at least 8 characters for your password.' })
  .refine((p) => new TextEncoder().encode(p).length <= 72, { error: 'Use a password of 72 characters or fewer.' });

export const signUpInput = z.object({
  name: z
    .string({ error: 'Enter your name.' })
    .trim()
    .min(1, { error: 'Enter your name.' })
    .max(80, { error: 'Keep your name under 80 characters.' }),
  email,
  password: newPassword,
  role: z.enum(['BUYER', 'CREATIVE'], { error: 'Choose whether you want to buy or sell.' }),
});

export const signInInput = z.object({
  email,
  password: z.string({ error: 'Enter your password.' }).min(1, { error: 'Enter your password.' }).max(200),
});

export type SignUpInput = z.infer<typeof signUpInput>;
export type SignInInput = z.infer<typeof signInInput>;

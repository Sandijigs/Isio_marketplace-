'use client';

import Link from 'next/link';

import { SegmentError } from '@/components/site/segment-error';

/**
 * Last-resort boundary, for failures above a page's own error.tsx (such as a
 * layout that checks the session or looks up a stall). Client-only, so no header.
 */
export default function AppError({ retry }: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  return (
    <main className="mx-auto w-full max-w-[1360px] px-[clamp(16px,4vw,40px)] py-[clamp(48px,8vw,112px)]">
      <SegmentError
        title="This page didn’t load."
        message="Something went wrong on our side. Try again in a moment, or go back to the market."
        retry={retry}
      />
      <Link href="/" className="mt-6 inline-block font-bold text-ink underline underline-offset-4 hover:text-indigo">
        Back to the market
      </Link>
    </main>
  );
}

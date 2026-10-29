'use client';

import { buttonClasses } from '@/components/ui/button-link';

/** The body of an error.tsx boundary: what failed, and a retry that refetches. */
export function SegmentError({ title, message, retry }: Readonly<{ title: string; message: string; retry: () => void }>) {
  return (
    <div role="alert" className="flex max-w-[640px] flex-col items-start gap-5">
      <h1 className="stretch-75 text-[clamp(40px,5vw,64px)] leading-[0.95] font-bold tracking-[-0.02em]">{title}</h1>
      <p className="text-lg font-medium">{message}</p>
      <button type="button" onClick={() => retry()} className={buttonClasses('ink')}>
        Try again
      </button>
    </div>
  );
}

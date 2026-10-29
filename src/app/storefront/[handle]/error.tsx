'use client';

import { SegmentError } from '@/components/site/segment-error';

export default function StorefrontError({ retry }: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  return (
    <SegmentError
      title="This stall didn’t load."
      message="Something went wrong on our side while opening this stall. Try again in a moment."
      retry={retry}
    />
  );
}

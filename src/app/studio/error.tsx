'use client';

import { SegmentError } from '@/components/site/segment-error';

export default function StudioError({ retry }: Readonly<{ error: Error & { digest?: string }; retry: () => void }>) {
  return (
    <SegmentError
      title="Your studio didn’t load."
      message="Something went wrong while loading your profile. Your saved details are safe. Try again in a moment."
      retry={retry}
    />
  );
}

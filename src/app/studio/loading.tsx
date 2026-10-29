import { Skeleton } from '@/components/ui/skeleton';

export default function StudioLoading() {
  return (
    <div className="flex max-w-[640px] flex-col gap-7" aria-busy="true">
      <span className="sr-only">Loading your studio…</span>
      <Skeleton className="h-[clamp(44px,6vw,80px)] w-3/4" />
      <Skeleton className="h-6 w-full" />
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[52px] w-full" />
        </div>
      ))}
    </div>
  );
}

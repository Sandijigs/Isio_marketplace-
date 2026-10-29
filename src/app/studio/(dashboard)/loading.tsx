import { Skeleton } from '@/components/ui/skeleton';

export default function StudioLoading() {
  return (
    <div className="flex flex-col gap-7" aria-busy="true">
      <span className="sr-only">Loading your studio…</span>
      <Skeleton className="h-[clamp(44px,6vw,80px)] w-3/4 max-w-[640px]" />
      <Skeleton className="h-6 w-full max-w-[640px]" />
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 4 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 border-2 border-line p-3">
            <Skeleton className="size-[72px] shrink-0" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

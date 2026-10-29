import { Skeleton } from '@/components/ui/skeleton';

export default function StorefrontLoading() {
  return (
    <div className="flex flex-col gap-[clamp(40px,6vw,80px)]" aria-busy="true">
      <span className="sr-only">Loading this stall…</span>
      <div className="flex flex-wrap items-end gap-6">
        <Skeleton className="size-[clamp(96px,14vw,148px)] rounded-full" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[clamp(52px,7vw,104px)] w-[min(420px,70vw)]" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
      </div>
      <div className="flex max-w-[44em] flex-col gap-3 border-t-2 border-line pt-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
      <div className="flex flex-col gap-4 border-t-2 border-line pt-8">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-36 w-full" />
      </div>
    </div>
  );
}

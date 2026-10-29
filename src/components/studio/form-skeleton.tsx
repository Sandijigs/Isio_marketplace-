import { Skeleton } from '@/components/ui/skeleton';

/** Stands in for a studio form while it loads: a title, an intro line and labelled fields. */
export function FormSkeleton({ label, fields = 5 }: Readonly<{ label: string; fields?: number }>) {
  return (
    <div className="flex max-w-[640px] flex-col gap-7" aria-busy="true">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-[clamp(44px,6vw,80px)] w-3/4" />
      <Skeleton className="h-6 w-full" />
      {Array.from({ length: fields }, (_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-[52px] w-full" />
        </div>
      ))}
    </div>
  );
}

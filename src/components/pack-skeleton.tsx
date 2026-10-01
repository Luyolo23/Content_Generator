import { Skeleton } from "@/components/ui/skeleton";

export function PackSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-live="polite">
      <span className="sr-only">Building your learning pack</span>
      <div className="card-surface overflow-hidden">
        <div className="skeleton-shimmer h-40 rounded-none" />
        <div className="space-y-3 p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="card-surface accent-left space-y-3 border-l-primary/40 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

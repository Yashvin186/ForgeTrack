export default function Skeleton({ className }) {
  return (
    <div className={`animate-pulse bg-surface-raised rounded-md ${className}`}></div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card p-8 space-y-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-4 w-full">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-b border-border-subtle">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 flex-1" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

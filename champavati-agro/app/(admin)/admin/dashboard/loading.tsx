import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, CardSkeleton } from "@/components/common/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6 lg:p-8">
      <Skeleton className="h-56 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <KpiRowSkeleton count={6} />
      <div className="grid gap-6 lg:grid-cols-2">
        <CardSkeleton lines={5} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, CardSkeleton } from "@/components/common/skeletons";

export default function FarmerProfileLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="mb-8">
        <KpiRowSkeleton count={5} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={3} />
        </div>
        <CardSkeleton lines={6} />
      </div>
    </div>
  );
}

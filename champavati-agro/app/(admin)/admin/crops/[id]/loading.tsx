import { Skeleton } from "@/components/ui/skeleton";
import { KpiRowSkeleton, TimelineSkeleton, CardSkeleton } from "@/components/common/skeletons";

export default function CropProfileLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-72" />
      </div>
      <div className="mb-8">
        <KpiRowSkeleton count={4} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border bg-card p-5">
            <Skeleton className="mb-4 h-5 w-40" />
            <TimelineSkeleton steps={6} />
          </div>
          <CardSkeleton lines={3} />
        </div>
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}

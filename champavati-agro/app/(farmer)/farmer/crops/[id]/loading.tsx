import { Skeleton } from "@/components/ui/skeleton";
import { TimelineSkeleton, CardSkeleton } from "@/components/common/skeletons";

export default function FarmerCropDetailLoading() {
  return (
    <div className="space-y-4 p-4">
      <div>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      <CardSkeleton lines={2} />
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="mb-4 h-4 w-32" />
        <TimelineSkeleton steps={5} />
      </div>
      <CardSkeleton lines={3} />
    </div>
  );
}

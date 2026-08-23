import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/common/skeletons";

export default function FarmerProfileLoading() {
  return (
    <div className="space-y-6 p-4">
      <div>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="mt-2 h-3 w-56" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={2} />
    </div>
  );
}

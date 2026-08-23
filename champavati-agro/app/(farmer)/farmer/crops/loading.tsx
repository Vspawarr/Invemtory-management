import { Skeleton } from "@/components/ui/skeleton";
import { CardSkeleton } from "@/components/common/skeletons";

export default function FarmerCropsLoading() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-6 w-32" />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
      <CardSkeleton lines={3} />
    </div>
  );
}

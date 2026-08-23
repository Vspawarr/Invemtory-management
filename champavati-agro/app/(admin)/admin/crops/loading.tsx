import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/common/skeletons";

export default function CropsLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}

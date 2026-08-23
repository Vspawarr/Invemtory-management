import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/common/skeletons";

export default function FarmersLoading() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="mb-4 h-10 w-full max-w-sm" />
      <TableSkeleton rows={8} />
    </div>
  );
}

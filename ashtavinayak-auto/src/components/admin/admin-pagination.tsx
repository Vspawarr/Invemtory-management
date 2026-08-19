import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AdminPagination({
  total,
  page,
  pageSize,
  searchParams = {},
}: {
  total: number;
  page: number;
  pageSize: number;
  searchParams?: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || !value) continue;
      params.set(key, value);
    }
    params.set("page", String(p));
    return `?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>
          Previous
        </Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>
          Next
        </Link>
      </Button>
    </div>
  );
}

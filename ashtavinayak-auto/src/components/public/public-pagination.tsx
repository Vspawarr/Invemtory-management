import Link from "next/link";
import { Button } from "@/components/ui/button";

export function PublicPagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (key === "page" || !value) continue;
      params.set(key, value);
    }
    params.set("page", String(p));
    return `/vehicles?${params.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <Button variant="outline" size="sm" asChild disabled={page <= 1}>
        <Link href={buildHref(Math.max(1, page - 1))} aria-disabled={page <= 1}>Previous</Link>
      </Button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-2">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="text-muted-foreground">…</span>}
          <Button variant={p === page ? "default" : "outline"} size="sm" asChild>
            <Link href={buildHref(p)}>{p}</Link>
          </Button>
        </span>
      ))}
      <Button variant="outline" size="sm" asChild disabled={page >= totalPages}>
        <Link href={buildHref(Math.min(totalPages, page + 1))} aria-disabled={page >= totalPages}>Next</Link>
      </Button>
    </nav>
  );
}

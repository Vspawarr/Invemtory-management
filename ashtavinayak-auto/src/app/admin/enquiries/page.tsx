import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ENQUIRY_STATUS_LABELS, ENQUIRY_STATUS_OPTIONS } from "@/lib/vehicle-options";

export const metadata = { title: "Enquiries" };

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "destructive" | "secondary"> = {
  NEW: "warning",
  CONTACTED: "secondary",
  FOLLOW_UP: "secondary",
  INTERESTED: "success",
  CLOSED: "muted",
  NOT_INTERESTED: "destructive",
};

export default async function AdminEnquiriesPage({ searchParams }: PageProps<"/admin/enquiries">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.EnquiryWhereInput = status ? { status: status as Prisma.EnumEnquiryStatusFilter["equals"] } : {};

  const [enquiries, total] = await Promise.all([
    prisma.enquiry.findMany({
      where,
      include: { vehicle: { select: { slug: true, brand: true, model: true, year: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.enquiry.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <p className="text-sm text-muted-foreground">{total} enquirie(s)</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3" method="get">
          <select name="status" defaultValue={status} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All statuses</option>
            {ENQUIRY_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((e) => (
              <TableRow key={e.id}>
                <TableCell>{e.name}</TableCell>
                <TableCell>{e.phone}</TableCell>
                <TableCell>
                  {e.vehicle ? (
                    <Link href={`/vehicles/${e.vehicle.slug}`} target="_blank" className="underline">
                      {e.vehicle.year} {e.vehicle.brand} {e.vehicle.model}
                    </Link>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{e.message || "—"}</TableCell>
                <TableCell className="text-xs">{format(e.createdAt, "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[e.status] ?? "secondary"}>{ENQUIRY_STATUS_LABELS[e.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/enquiries/${e.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {enquiries.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  No enquiries match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} searchParams={{ status }} />
    </div>
  );
}

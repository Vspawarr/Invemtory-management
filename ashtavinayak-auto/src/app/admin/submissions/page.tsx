import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { formatPrice } from "@/lib/utils";
import { SUBMISSION_STATUS_LABELS, VEHICLE_TYPE_OPTIONS } from "@/lib/vehicle-options";

export const metadata = { title: "Vehicle Submissions" };

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "destructive" | "secondary"> = {
  PENDING_REVIEW: "warning",
  UNDER_REVIEW: "secondary",
  MORE_INFORMATION_REQUIRED: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export default async function AdminSubmissionsPage({ searchParams }: PageProps<"/admin/submissions">) {
  const params = await searchParams;
  const status = typeof params.status === "string" ? params.status : "";
  const type = typeof params.type === "string" ? params.type : "";
  const city = typeof params.city === "string" ? params.city : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.VehicleSubmissionWhereInput = {
    ...(status ? { status: status as Prisma.EnumSubmissionStatusFilter["equals"] } : {}),
    ...(type ? { vehicleType: type as Prisma.EnumVehicleTypeFilter["equals"] } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" } } : {}),
  };

  const [submissions, total] = await Promise.all([
    prisma.vehicleSubmission.findMany({
      where,
      include: { seller: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicleSubmission.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Vehicle Submissions</h1>
        <p className="text-sm text-muted-foreground">{total} submission(s)</p>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3" method="get">
          <select name="status" defaultValue={status} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All statuses</option>
            {Object.entries(SUBMISSION_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select name="type" defaultValue={type} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">All types</option>
            {VEHICLE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <Input name="city" placeholder="City" defaultValue={city} className="max-w-xs" />
          <Button type="submit" variant="secondary">Filter</Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reference</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Mobile</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Expected Price</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.referenceNumber}</TableCell>
                <TableCell>{s.seller.name}</TableCell>
                <TableCell>{s.seller.phone}</TableCell>
                <TableCell>{s.brand} {s.model}</TableCell>
                <TableCell className="text-xs">{s.vehicleType}</TableCell>
                <TableCell>{s.year}</TableCell>
                <TableCell>{formatPrice(s.expectedPrice)}</TableCell>
                <TableCell>{s.city}</TableCell>
                <TableCell className="text-xs">{format(s.createdAt, "dd MMM yyyy")}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[s.status] ?? "secondary"}>{SUBMISSION_STATUS_LABELS[s.status]}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/admin/submissions/${s.id}`}>Review</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {submissions.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  No submissions match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} searchParams={{ status, type, city }} />
    </div>
  );
}

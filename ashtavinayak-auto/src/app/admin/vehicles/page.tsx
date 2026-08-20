import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AppImage } from "@/components/app-image";
import { VehicleRowActions } from "@/components/admin/vehicle-row-actions";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { formatPrice, formatNumber } from "@/lib/utils";
import { VEHICLE_STATUS_LABELS } from "@/lib/vehicle-options";

export const metadata = { title: "Inventory" };

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "success" | "warning" | "muted" | "destructive" | "secondary"> = {
  LISTED: "success",
  RESERVED: "warning",
  SOLD: "muted",
  DRAFT: "secondary",
  PENDING_REVIEW: "warning",
  REJECTED: "destructive",
  ARCHIVED: "muted",
};

export default async function AdminVehiclesPage({
  searchParams,
}: PageProps<"/admin/vehicles">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const source = typeof params.source === "string" ? params.source : "";
  const page = Math.max(1, Number(params.page) || 1);

  const where: Prisma.VehicleWhereInput = {
    ...(status ? { status: status as Prisma.EnumVehicleStatusFilter["equals"] } : {}),
    ...(source ? { source: source as Prisma.EnumVehicleSourceFilter["equals"] } : {}),
    ...(q
      ? {
          OR: [
            { brand: { contains: q, mode: "insensitive" } },
            { model: { contains: q, mode: "insensitive" } },
            { variant: { contains: q, mode: "insensitive" } },
            { city: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">{total} vehicle(s)</p>
        </div>
        <Button asChild>
          <Link href="/admin/vehicles/new">
            <Plus className="h-4 w-4" />
            Add Vehicle
          </Link>
        </Button>
      </div>

      <Card className="p-4">
        <form className="flex flex-wrap gap-3" method="get">
          <Input name="q" placeholder="Search brand, model, city..." defaultValue={q} className="max-w-xs" />
          <select
            name="status"
            defaultValue={status}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All statuses</option>
            {Object.entries(VEHICLE_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            name="source"
            defaultValue={source}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">All sources</option>
            <option value="BUSINESS_STOCK">Business Stock</option>
            <option value="CUSTOMER_SUBMITTED">Customer Submitted</option>
          </select>
          <Button type="submit" variant="secondary">
            Filter
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Photo</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>KM</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Featured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((v) => (
              <TableRow key={v.id}>
                <TableCell>
                  <div className="relative h-12 w-16 overflow-hidden rounded bg-muted">
                    {v.images[0] && (
                      <AppImage src={v.images[0].url} alt="" fill className="object-cover" sizes="64px" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  {v.brand} {v.model} {v.variant}
                </TableCell>
                <TableCell>{v.category.name}</TableCell>
                <TableCell className="text-xs">
                  {v.source === "BUSINESS_STOCK" ? "Business Stock" : "Customer Submitted"}
                </TableCell>
                <TableCell>{v.year}</TableCell>
                <TableCell>{formatPrice(v.price)}</TableCell>
                <TableCell>{formatNumber(v.kilometres)}</TableCell>
                <TableCell>{v.city}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[v.status] ?? "secondary"}>
                    {VEHICLE_STATUS_LABELS[v.status]}
                  </Badge>
                </TableCell>
                <TableCell>{v.isFeatured ? "Yes" : "—"}</TableCell>
                <TableCell>
                  <VehicleRowActions id={v.id} status={v.status} isFeatured={v.isFeatured} />
                </TableCell>
              </TableRow>
            ))}
            {vehicles.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="py-8 text-center text-muted-foreground">
                  No vehicles match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <AdminPagination total={total} page={page} pageSize={PAGE_SIZE} searchParams={{ q, status, source }} />
    </div>
  );
}

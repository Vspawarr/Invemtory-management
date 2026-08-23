import Link from "next/link";
import type { Metadata } from "next";
import { Plus, Users } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listFarmers } from "@/lib/server/dal/farmers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Farmers — Champavati Agro" };

export default async function FarmersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const session = await requireSession();
  const { farmers, total } = await listFarmers(session, { search: q, take: 50 });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Farmers</h1>
          <p className="text-sm text-muted-foreground">{total} registered farmer{total === 1 ? "" : "s"}</p>
        </div>
        <Button asChild>
          <Link href="/admin/farmers/new">
            <Plus className="size-4" /> Add Farmer
          </Link>
        </Button>
      </div>

      <form className="mb-4 max-w-sm">
        <Input name="q" defaultValue={q} placeholder="Search by name, mobile, village, or ID…" />
      </form>

      {farmers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={q ? "No farmers match that search" : "No farmers yet"}
          description={
            q
              ? "Try a different name, mobile number, or village."
              : "Start building your farmer records — add the first farmer's profile, land, and crops."
          }
          action={
            !q && (
              <Button asChild>
                <Link href="/admin/farmers/new">
                  <Plus className="size-4" /> Add Farmer
                </Link>
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Village</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Active crops</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {farmers.map((farmer) => {
                const totalAcres = farmer.landParcels.reduce(
                  (sum, p) => sum + Number(p.areaAcres),
                  0
                );
                const activeCrops = farmer.crops.filter(
                  (c) => !["COMPLETED", "HARVESTED", "FAILED", "CANCELLED"].includes(c.status)
                ).length;
                return (
                  <TableRow key={farmer.id} className="cursor-pointer">
                    <TableCell className="font-medium">
                      <Link href={`/admin/farmers/${farmer.id}`} className="hover:underline">
                        {farmer.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{farmer.phone}</TableCell>
                    <TableCell>{farmer.village}</TableCell>
                    <TableCell>{totalAcres.toFixed(2)} acres</TableCell>
                    <TableCell>
                      {activeCrops > 0 ? (
                        <Badge variant="success">{activeCrops} active</Badge>
                      ) : (
                        <Badge variant="muted">None</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

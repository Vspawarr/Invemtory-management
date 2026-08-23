import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Plus, Sprout } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listCropsForCurrentUser } from "@/lib/server/dal/crops";
import { confirmedCurrentStageStatus, isStatusConcerning } from "@/lib/server/crop-timeline/rules";
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
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Crops — Champavati Agro" };

const STATUS_TONE: Record<string, "success" | "warning" | "muted"> = {
  PLANNED: "muted",
  SEEDED: "muted",
  GROWING: "success",
  FLOWERING: "success",
  DEVELOPMENT: "success",
  HARVEST_READY: "warning",
  HARVESTED: "muted",
  COMPLETED: "muted",
  FAILED: "warning",
  CANCELLED: "muted",
};

const ACTIVE_STATUSES = ["SEEDED", "GROWING", "FLOWERING", "DEVELOPMENT", "HARVEST_READY"] as const;

export default async function CropsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status, q } = await searchParams;
  const session = await requireSession();
  const crops = await listCropsForCurrentUser(session, {
    status: status === "active" ? [...ACTIVE_STATUSES] : undefined,
    search: q,
  });
  const today = new Date();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">
            {status === "active" ? "Active crops" : "All crops"}
          </h1>
          <p className="text-sm text-muted-foreground">{crops.length} crop cycle{crops.length === 1 ? "" : "s"}</p>
        </div>
        <Button asChild>
          <Link href="/admin/crops/new">
            <Plus className="size-4" /> Add Crop
          </Link>
        </Button>
      </div>

      {crops.length === 0 ? (
        <EmptyState
          icon={Sprout}
          title="No active crops"
          description="Start by adding a farmer's first crop cycle."
          action={
            <Button asChild>
              <Link href="/admin/crops/new">
                <Plus className="size-4" /> Add Crop
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Crop</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Land</TableHead>
                <TableHead>Current stage</TableHead>
                <TableHead>Expected harvest</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {crops.map((crop) => (
                <TableRow key={crop.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/crops/${crop.id}`} className="hover:underline">
                      {crop.cropMaster.name}
                      {crop.variety ? ` — ${crop.variety}` : ""}
                    </Link>
                  </TableCell>
                  <TableCell>{crop.farmer.fullName}</TableCell>
                  <TableCell>{crop.landParcel.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{crop.currentStage?.stageNameSnapshot ?? "—"}</span>
                      {crop.currentStage && isStatusConcerning(confirmedCurrentStageStatus(crop.currentStage, today)) && (
                        <Badge variant="warning" className="text-[10px]">
                          {confirmedCurrentStageStatus(crop.currentStage, today) === "DELAYED"
                            ? "Delayed"
                            : "Needs review"}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {crop.expectedHarvestDate ? format(crop.expectedHarvestDate, "d MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[crop.status] ?? "muted"}>
                      {crop.status.replaceAll("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

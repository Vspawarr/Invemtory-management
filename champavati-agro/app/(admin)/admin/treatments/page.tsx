import Link from "next/link";
import type { Metadata } from "next";
import { format } from "date-fns";
import { Stethoscope } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listRecommendations } from "@/lib/server/dal/treatments";
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

export const metadata: Metadata = { title: "Treatments — Champavati Agro" };

const STATUS_TONE: Record<string, "muted" | "warning" | "success" | "danger"> = {
  RECOMMENDED: "muted",
  PURCHASED: "warning",
  APPLIED: "success",
  NOT_APPLIED: "danger",
  CANCELLED: "danger",
};

export default async function TreatmentsPage() {
  const session = await requireSession();
  const recommendations = await listRecommendations(session);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Treatments</h1>
        <p className="text-sm text-muted-foreground">{recommendations.length} recommendations recorded</p>
      </div>

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No treatments recorded yet"
          description="Recommendations you make from a Crop 360° page will appear here."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Farmer</TableHead>
                <TableHead>Crop</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recommendations.map((rec) => {
                const app = rec.applications[0];
                return (
                  <TableRow key={rec.id}>
                    <TableCell>{format(rec.createdAt, "d MMM yyyy")}</TableCell>
                    <TableCell>
                      <Link href={`/admin/farmers/${rec.crop.farmer.id}`} className="hover:underline">
                        {rec.crop.farmer.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/crops/${rec.crop.id}`} className="hover:underline">
                        {rec.crop.cropMaster.name}
                      </Link>
                    </TableCell>
                    <TableCell>{rec.product.name}</TableCell>
                    <TableCell>
                      {app && <Badge variant={STATUS_TONE[app.status]}>{app.status.replaceAll("_", " ")}</Badge>}
                    </TableCell>
                    <TableCell>
                      {app?.treatmentResult ? app.treatmentResult.result.replaceAll("_", " ") : "—"}
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

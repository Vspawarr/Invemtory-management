import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  Landmark,
  MapPin,
  Phone,
  Plus,
  Sprout,
  ThumbsUp,
  Wheat,
} from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getFarmerById, getFarmerStats } from "@/lib/server/dal/farmers";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { AadhaarReveal } from "@/components/farmers/aadhaar-reveal";
import { PortalAccessCard } from "@/components/farmers/portal-access-card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Farmer 360° — Champavati Agro" };

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

export default async function FarmerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const farmer = await getFarmerById(session, id);
  if (!farmer) notFound();
  const stats = await getFarmerStats(session, id);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold">{farmer.fullName}</h1>
            <Badge variant="outline" className="font-mono text-[11px]">
              {farmer.id.slice(-8)}
            </Badge>
          </div>
          <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Phone className="size-3.5" /> {farmer.phone}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" /> {farmer.village}, {farmer.taluka}
            </span>
          </p>
        </div>
        <Button asChild>
          <Link href={`/admin/crops/new?farmerId=${farmer.id}`}>
            <Plus className="size-4" /> Add Crop
          </Link>
        </Button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Total land"
          value={stats.totalLandAcres}
          decimals={2}
          suffix=" ac"
          icon={<Landmark className="size-4" />}
          index={0}
        />
        <KpiCard
          label="Active crops"
          value={stats.activeCrops}
          icon={<Sprout className="size-4" />}
          index={1}
        />
        <KpiCard
          label="Total crops"
          value={stats.totalCrops}
          icon={<Wheat className="size-4" />}
          index={2}
        />
        <KpiCard
          label="Treatment success"
          value={stats.treatmentSuccessRate}
          suffix="%"
          icon={<ThumbsUp className="size-4" />}
          tone="success"
          index={3}
        />
        <KpiCard
          label="Satisfaction"
          value={stats.avgSatisfaction}
          decimals={1}
          suffix=" / 5"
          icon={<ThumbsUp className="size-4" />}
          tone="warning"
          index={4}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Crops</CardTitle>
            </CardHeader>
            <CardContent>
              {farmer.crops.length === 0 ? (
                <EmptyState
                  icon={Sprout}
                  title="No active crops"
                  description="Start by adding this farmer's first crop cycle."
                  action={
                    <Button asChild size="sm">
                      <Link href={`/admin/crops/new?farmerId=${farmer.id}`}>
                        <Plus className="size-4" /> Add Crop
                      </Link>
                    </Button>
                  }
                />
              ) : (
                <ul className="divide-y">
                  {farmer.crops.map((crop) => (
                    <li key={crop.id}>
                      <Link
                        href={`/admin/crops/${crop.id}`}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-80"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {crop.cropMaster.name}
                            {crop.variety ? ` — ${crop.variety}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {crop.landParcel.name} · {Number(crop.areaAcres).toFixed(2)} ac ·{" "}
                            {crop.season}
                          </p>
                        </div>
                        <Badge variant={STATUS_TONE[crop.status] ?? "muted"}>
                          {crop.status.replaceAll("_", " ")}
                        </Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Land parcels</CardTitle>
            </CardHeader>
            <CardContent>
              {farmer.landParcels.length === 0 ? (
                <p className="text-sm text-muted-foreground">No land parcels recorded.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {farmer.landParcels.map((parcel) => (
                    <div key={parcel.id} className="rounded-lg border p-3">
                      <p className="text-sm font-medium">{parcel.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {Number(parcel.areaAcres).toFixed(2)} acres · {parcel.village}
                      </p>
                      {parcel.soilType && (
                        <p className="mt-1 text-xs text-muted-foreground">Soil: {parcel.soilType}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <PortalAccessCard farmerId={farmer.id} phone={farmer.phone} hasAccess={!!farmer.userId} />
          <Card>
            <CardHeader>
              <CardTitle>Personal information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Father/Husband" value={farmer.fatherOrHusbandName} />
              <Row label="Gender" value={farmer.gender} />
              <Row label="Address" value={farmer.address} />
              <Row label="District" value={farmer.district} />
              <Row label="State" value={farmer.state} />
              <Row label="PIN" value={farmer.pincode} />
              <Separator />
              {farmer.documents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No documents on file.</p>
              ) : (
                farmer.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{doc.type}</span>
                    <AadhaarReveal documentId={doc.id} masked={doc.valueMasked} />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

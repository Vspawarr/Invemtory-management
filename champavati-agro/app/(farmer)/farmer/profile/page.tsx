import type { Metadata } from "next";
import { format } from "date-fns";
import { Landmark, ShoppingBag, Stethoscope } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { getOwnFarmerProfile, getFarmerStats, getFarmerHistory } from "@/lib/server/dal/farmers";
import { formatRelationshipDuration } from "@/lib/server/farmer-relationship";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TreatmentJourney } from "@/components/crops/treatment-journey";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "My Farm — Champavati Agro" };

const OWNERSHIP_LABEL: Record<string, string> = {
  OWNED: "Owned",
  LEASED: "Leased",
  SHARECROPPED: "Sharecropped",
  OTHER: "Other",
};

export default async function FarmerProfilePage() {
  const session = await requireSession();
  const farmer = await getOwnFarmerProfile(session);
  if (!farmer) return null;

  const [stats, history] = await Promise.all([
    getFarmerStats(session, farmer.id),
    getFarmerHistory(session, farmer.id),
  ]);

  const relationship = stats.registeredAt ? formatRelationshipDuration(stats.registeredAt) : "—";

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="font-display text-xl font-semibold">My farm</h1>
        <p className="text-sm text-muted-foreground">
          With Champavati Agro for {relationship}
          {stats.registeredAt ? ` (since ${format(stats.registeredAt, "d MMM yyyy")})` : ""}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KpiCard label="Land" value={stats.totalLandAcres} decimals={1} suffix=" ac" icon={<Landmark className="size-4" />} index={0} />
        <KpiCard label="Harvested" value={stats.cropsHarvested} icon={<ShoppingBag className="size-4" />} index={1} />
        <KpiCard label="Treatments" value={stats.totalTreatments} icon={<Stethoscope className="size-4" />} index={2} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My land</CardTitle>
        </CardHeader>
        <CardContent>
          {farmer.landParcels.length === 0 ? (
            <p className="text-sm text-muted-foreground">No land parcels on file yet.</p>
          ) : (
            <div className="space-y-3">
              {farmer.landParcels.map((parcel) => (
                <div key={parcel.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{parcel.name}</p>
                    <Badge variant="outline" className="text-[10px]">
                      {OWNERSHIP_LABEL[parcel.ownershipStatus] ?? parcel.ownershipStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {Number(parcel.areaAcres).toFixed(2)} acres · {parcel.village}
                  </p>
                  {parcel.soilType && <p className="mt-1 text-xs text-muted-foreground">Soil: {parcel.soilType}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Treatment history</CardTitle>
        </CardHeader>
        <CardContent>
          {history.recommendations.length === 0 ? (
            <EmptyState
              icon={Stethoscope}
              title="No treatments yet"
              description="Recommendations from the shop will appear here."
              className="py-8"
            />
          ) : (
            <TreatmentJourney recommendations={history.recommendations} editable={false} basePath="/farmer" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {history.transactions.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No purchases recorded"
              description="Products you've purchased from the shop will appear here."
              className="py-8"
            />
          ) : (
            <ul className="space-y-3">
              {history.transactions.map((txn) => (
                <li key={txn.id} className="rounded-lg border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">₹{Number(txn.totalAmount).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground">{format(txn.createdAt, "d MMM yyyy")}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {txn.items.map((i) => i.product.name).join(", ")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

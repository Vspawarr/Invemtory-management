import type { Metadata } from "next";
import { Box, Landmark, ShieldAlert, Sprout, Wheat } from "lucide-react";

import { requireSession } from "@/lib/server/require-session";
import { listFarmersForFarm3D, getFarmer3DData } from "@/lib/server/dal/farm-3d";
import { FarmView } from "@/components/farm-3d/farm-view";
import { FarmerPicker } from "@/components/farm-3d/farmer-picker";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { EmptyState } from "@/components/common/empty-state";

export const metadata: Metadata = { title: "Digital Farm — Champavati Agro" };

export default async function DigitalFarmPage({
  searchParams,
}: {
  searchParams: Promise<{ farmerId?: string }>;
}) {
  const session = await requireSession();
  const { farmerId: requestedFarmerId } = await searchParams;

  const farmers = await listFarmersForFarm3D(session);

  if (farmers.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={Box}
          title="No farmers yet"
          description="Add a farmer with land parcels to see their fields in the Digital Farm."
        />
      </div>
    );
  }

  const selectedFarmerId =
    requestedFarmerId && farmers.some((f) => f.id === requestedFarmerId) ? requestedFarmerId : farmers[0].id;
  const selectedFarmer = farmers.find((f) => f.id === selectedFarmerId)!;

  const plots = await getFarmer3DData(session, selectedFarmerId);
  const totalAcres = plots.reduce((sum, p) => sum + p.areaAcres, 0);
  const activeCrops = plots.filter((p) => p.crop).length;
  const needsReviewCount = plots.filter((p) => p.crop?.needsReview).length;
  const harvestReadyCount = plots.filter((p) => p.crop?.harvestReady).length;

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold">Digital Farm</h1>
          <p className="text-sm text-muted-foreground">
            {selectedFarmer.fullName}&apos;s fields, in 3D — real land, real crops, real status.
          </p>
        </div>
        <FarmerPicker farmers={farmers} selectedFarmerId={selectedFarmerId} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Land parcels" value={plots.length} icon={<Landmark className="size-4" />} index={0} />
        <KpiCard
          label="Total acreage"
          value={totalAcres}
          decimals={2}
          suffix=" ac"
          icon={<Landmark className="size-4" />}
          index={1}
        />
        <KpiCard label="Active crops" value={activeCrops} icon={<Sprout className="size-4" />} index={2} />
        <KpiCard
          label="Needs review"
          value={needsReviewCount}
          icon={<ShieldAlert className="size-4" />}
          index={3}
        />
        <KpiCard label="Harvest ready" value={harvestReadyCount} icon={<Wheat className="size-4" />} index={4} />
      </div>

      {plots.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No land parcels recorded"
          description={`${selectedFarmer.fullName} has no land parcels on file yet.`}
        />
      ) : (
        <FarmView plots={plots} />
      )}
    </div>
  );
}
